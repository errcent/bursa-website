import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { assertImageStudioEnabled } from "@/lib/image-studio/guard";
import { appendLedgerEntry, saveStudioImage } from "@/lib/image-studio/ledger";
import { readFluxPoolSnapshot, writeFluxPoolSnapshot } from "@/lib/image-studio/flux-pool";
import { getStudioProvider } from "@/lib/image-studio/registry";
import type { StudioProviderId } from "@/lib/image-studio/types";

const bodySchema = z.object({
  provider: z.enum(["bfl", "pollinations"]),
  model: z.string().min(1),
  prompt: z.string().min(1).max(4000),
  width: z.number().int().min(256).max(4096),
  height: z.number().int().min(256).max(4096),
  quality: z.enum(["low", "medium", "high"]).optional(),
  seed: z.number().int().optional(),
  preset: z.enum(["portrait", "still-life", "custom"]).optional(),
});

async function decrementFluxPoolIfFree() {
  const snapshot = await readFluxPoolSnapshot();
  if (!snapshot || snapshot.freeGenerationsRemaining <= 0) return;
  await writeFluxPoolSnapshot({
    ...snapshot,
    syncedAt: new Date().toISOString(),
    freeGenerationsRemaining: Math.max(0, snapshot.freeGenerationsRemaining - 1),
  });
}

export async function POST(request: Request) {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const provider = getStudioProvider(body.provider as StudioProviderId);
  if (!provider.isConfigured()) {
    return NextResponse.json(
      { error: `Provider ${provider.name} belum dikonfigurasi.` },
      { status: 400 }
    );
  }

  const id = randomUUID();

  try {
    const result = await provider.generate({
      providerId: body.provider,
      modelId: body.model,
      prompt: body.prompt,
      width: body.width,
      height: body.height,
      quality: body.quality,
      seed: body.seed,
      preset: body.preset,
    });

    const filePath = await saveStudioImage(id, result.imageBuffer);

    if (body.provider === "bfl" && result.isFree) {
      await decrementFluxPoolIfFree();
    }

    const entry = await appendLedgerEntry({
      id,
      provider: body.provider,
      model: body.model,
      prompt: body.prompt,
      preset: body.preset,
      width: body.width,
      height: body.height,
      quality: body.quality,
      seed: result.seed ?? body.seed,
      costEstimate: result.costEstimate,
      creditsBefore: result.creditsBefore,
      creditsAfter: result.creditsAfter,
      creditsUsed: result.creditsUsed,
      billingMode: result.billingMode,
      isFree: result.isFree,
      source: "studio",
      megapixels: result.megapixels,
      requestId:
        typeof result.providerMeta?.taskId === "string" ? result.providerMeta.taskId : undefined,
      filePath,
      status: "success",
    });

    return NextResponse.json({
      entry,
      imageUrl: `/api/studio/images/${id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate gagal";

    await appendLedgerEntry({
      id,
      provider: body.provider,
      model: body.model,
      prompt: body.prompt,
      preset: body.preset,
      width: body.width,
      height: body.height,
      quality: body.quality,
      seed: body.seed,
      costEstimate: 0,
      creditsBefore: null,
      creditsAfter: null,
      creditsUsed: null,
      billingMode: "free",
      isFree: true,
      source: "studio",
      filePath: "",
      status: "failed",
      error: message,
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
