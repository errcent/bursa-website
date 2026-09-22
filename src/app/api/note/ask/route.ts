import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";
import { answerAsk } from "@/lib/note/ask/answer";
import { ASK_SYSTEM_PROMPT, callAnthropic, callOpenAI, embedOpenAI } from "@/lib/note/ask/llm";
import { redactPII, truncateText } from "@/lib/note/ask/redact";
import { citeTrade, retrieveKeyword, type AskScope } from "@/lib/note/ask/retrieve";
import { searchAskVectors, storeAskEmbeddings, tradeSummary } from "@/lib/note/ask/vectors";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { isPnlKind } from "@/lib/note/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

const ASK_QUOTA_BLOB = "ask-quota";
const SERVER_KEY_DAILY_CAP = 10;

const askSchema = z.object({
  question: z.string().trim().min(3).max(500),
  symbols: z.array(z.string().trim().max(24)).max(10).optional().default([]),
  sessions: z.array(z.string().trim().max(24)).max(5).optional().default([]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  provider: z.enum(["anthropic", "openai"]).optional(),
  apiKey: z.string().trim().max(512).optional().default(""),
  model: z.string().trim().max(64).optional().default(""),
  locale: z.enum(["id", "en"]).optional().default("id"),
});

interface QuotaState {
  date: string;
  serverUsed: number;
}

async function checkServerQuota(apexUserId: string): Promise<boolean> {
  const repo = getNoteRepo();
  const today = new Date().toISOString().slice(0, 10);
  const raw = (await repo.getUserBlob(apexUserId, ASK_QUOTA_BLOB)) as unknown as QuotaState | null;
  const state: QuotaState =
    raw && raw.date === today ? raw : { date: today, serverUsed: 0 };
  if (state.serverUsed >= SERVER_KEY_DAILY_CAP) return false;
  state.serverUsed += 1;
  await repo.setUserBlob(apexUserId, ASK_QUOTA_BLOB, state);
  return true;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "ask", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) return applyNoteCors(jsonError("Payload tidak valid.", 400), origin);
    const { question, symbols, sessions, from, to, provider, apiKey, model } = parsed.data;
    const scope: AskScope = { symbols, sessions, from, to };

    const repo = getNoteRepo();
    const entries = await repo.listEntries(auth.session.userId);
    const locale = parsed.data.locale;
    const fmt = pnlOptsFromPrefs({
      numberFormat: "compact",
      heroRange: "all",
      defaultKind: "TRADE",
      calendarShowNet: true,
      weekStart: "sunday",
      decimals: 0,
      lossStyle: "minus",
      colorMode: "hue",
      density: "comfortable",
      emotionPrompt: "optional",
      locale,
      currency: "IDR",
      usdIdrRate: 16000,
      theme: "dark",
      onboardingCompleted: true,
      personalization: {},
      privacyMode: false,
      version: 1,
    });

    const deterministic = answerAsk(entries, question, scope, locale, fmt);

    // No LLM requested and no server key → deterministic answer stands alone.
    const wantsLlm = provider != null;
    const userKey = apiKey.trim();
    const serverKey =
      provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY?.trim() ?? ""
        : provider === "openai"
          ? process.env.OPENAI_API_KEY?.trim() ?? ""
          : "";
    if (!wantsLlm || (!userKey && !serverKey)) {
      return applyNoteCors(jsonOk({ answer: deterministic, llm: null, retrieval: "keyword" }), origin);
    }

    // Quota applies to server keys only; user keys are their own budget.
    const effectiveKey = userKey || serverKey;
    if (!userKey) {
      const allowed = await checkServerQuota(auth.session.userId);
      if (!allowed) {
        return applyNoteCors(
          jsonOk({ answer: deterministic, llm: null, retrieval: "keyword", quotaNote: "Kuota harian tercapai — jawaban deterministik di atas tetap valid." }),
          origin,
        );
      }
    }

    // Retrieval: vectors when OpenAI embeddings are reachable, else keyword.
    const trades = entries.filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open");
    let ranked = retrieveKeyword(entries, question, scope, 5);
    let retrieval: "keyword" | "vector" = "keyword";
    if (provider === "openai") {
      try {
        const byId = new Map(trades.map((e) => [e.id, e]));
        const candidates = trades.slice(-40);
        const vectors = await embedOpenAI(
          effectiveKey,
          candidates.map((e) => redactPII(tradeSummary(e))),
        );
        if (vectors.length > 0) {
          const items = candidates
            .slice(0, vectors.length)
            .map((entry, i) => ({ entry, embedding: vectors[i]! }))
            .filter((item) => item.embedding.length > 0);
          if (items.length > 0) {
            await storeAskEmbeddings(auth.session.userId, items);
            const [questionVector] = await embedOpenAI(effectiveKey, [question]);
            if (questionVector && questionVector.length > 0) {
              const found = await searchAskVectors(auth.session.userId, questionVector, byId, 5);
              if (found && found.length > 0) {
                ranked = found;
                retrieval = "vector";
              }
            }
          }
        }
      } catch {
        // Vector path is enhancement-only; keyword ranking stands.
      }
    }

    const context = ranked
      .map((r) => `- ${citeTrade(r.entry)} · net ${r.entry.pnl} · ${truncateText(redactPII([r.entry.thesis, r.entry.note, r.entry.lesson].filter(Boolean).join(" | ")), 200)}`)
      .join("\n");
    const userPrompt =
      `Question: ${question}\n\nJournal aggregates (use only these):\n${context || "(no matching trades)"}\n\nDeterministic draft: ${deterministic.text}`;
    const chosenModel =
      model ||
      (provider === "anthropic" ? "claude-sonnet-4-5" : "gpt-4o-mini");
    const text =
      provider === "anthropic"
        ? await callAnthropic({ apiKey: effectiveKey, model: chosenModel, system: ASK_SYSTEM_PROMPT, user: userPrompt })
        : await callOpenAI({ apiKey: effectiveKey, model: chosenModel, system: ASK_SYSTEM_PROMPT, user: userPrompt });

    return applyNoteCors(
      jsonOk({
        answer: deterministic,
        llm: { text, provider, citations: ranked.map((r) => citeTrade(r.entry)) },
        retrieval,
      }),
      origin,
    );
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
