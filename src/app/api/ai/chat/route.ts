import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveTrustedEmail } from "@/lib/auth/request-identity";

/**
 * AI support chat skeleton (P3 blueprint).
 * Feature gated — returns 503 until AI_GATEWAY_URL is configured.
 *
 * Target flow: intent router → FAQ cache | RAG top-3 | deterministic tools
 * Context budget: max 2k tokens per LLM call.
 */

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().cuid().optional(),
});

function isAiEnabled(): boolean {
  return (
    process.env.AI_FEATURE_ENABLED === "true" &&
    Boolean(process.env.AI_GATEWAY_URL?.trim())
  );
}

export async function POST(request: Request) {
  const email = await resolveTrustedEmail(request);
  if (!email) {
    return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });
  }

  if (!isAiEnabled()) {
    return NextResponse.json(
      {
        error: "AI support belum aktif",
        hint: "Set AI_GATEWAY_URL dan jalankan npm run index-docs",
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // TODO (P3): daily token budget, RAG retrieval, LLM call, usage log
  return NextResponse.json(
    {
      reply: null,
      message: "AI route skeleton — implement RAG + gateway call",
      conversationId: parsed.data.conversationId ?? null,
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({
    enabled: isAiEnabled(),
    models: {
      router: process.env.AI_MODEL_ROUTER ?? "gpt-4o-mini",
      agent: process.env.AI_MODEL_AGENT ?? "gpt-4o",
    },
    dailyBudgetPerUser: Number(process.env.AI_DAILY_TOKEN_BUDGET_PER_USER ?? 10000),
  });
}
