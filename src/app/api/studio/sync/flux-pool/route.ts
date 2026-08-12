import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { megapixelsFor } from "@/lib/image-studio/config";
import { writeFluxPoolSnapshot } from "@/lib/image-studio/flux-pool";
import { assertImageStudioEnabled } from "@/lib/image-studio/guard";
import { upsertLedgerEntries } from "@/lib/image-studio/ledger";
import type { LedgerEntry } from "@/lib/image-studio/types";

const historyItemSchema = z.object({
  request_id: z.string().optional(),
  prompt: z.string().optional(),
  model: z.string().optional(),
  seed: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  cost: z.number().optional(),
  is_free: z.boolean().optional(),
  image_url: z.string().optional(),
});

const bodySchema = z.object({
  free_generations: z.number().optional(),
  free_generations_total_granted: z.number().optional(),
  credits: z.number().nullable().optional(),
  history: z.array(historyItemSchema).optional(),
});

export async function POST(request: Request) {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    const data = raw?.data ?? raw;
    body = bodySchema.parse(data);
  } catch {
    return NextResponse.json({ error: "Payload MCP tidak valid." }, { status: 400 });
  }

  const granted = body.free_generations_total_granted ?? 20;
  const remaining = body.free_generations ?? granted;

  const snapshot = await writeFluxPoolSnapshot({
    syncedAt: new Date().toISOString(),
    freeGenerationsRemaining: remaining,
    freeGenerationsGranted: granted,
    paidCredits: body.credits ?? null,
    source: "mcp",
  });

  let imported = 0;
  if (body.history?.length) {
    const entries: LedgerEntry[] = body.history
      .filter((item) => item.prompt)
      .map((item) => {
        const width = item.width ?? 1920;
        const height = item.height ?? 1080;
        const isFree = item.is_free ?? true;
        const creditsUsed = item.cost ?? 10;
        return {
          id: item.request_id ?? randomUUID(),
          provider: "bfl" as const,
          model: item.model ?? "flux2_max",
          prompt: item.prompt!,
          width,
          height,
          costEstimate: creditsUsed / 100,
          creditsUsed,
          creditsBefore: null,
          creditsAfter: null,
          billingMode: isFree ? "free" : "paid",
          isFree,
          source: "mcp" as const,
          requestId: item.request_id,
          megapixels: megapixelsFor(width, height),
          imageUrl: item.image_url,
          filePath: "",
          status: "success" as const,
          createdAt: new Date().toISOString(),
        };
      });

    await upsertLedgerEntries(entries);
    imported = entries.length;
  }

  return NextResponse.json({ fluxPool: snapshot, imported });
}
