import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { fetchYahooCandles, toYahooTicker } from "@/lib/note/market/candles";
import { computeExcursions } from "@/lib/note/replay/excursions";
import { getNoteRepo } from "@/lib/note/repo";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

const REPLAY_CACHE_BLOB = "replay-cache";

interface CachedReplay {
  fingerprint: string;
  payload: Record<string, unknown>;
}

/**
 * GET /api/note/replay?entryId=...
 * Returns entry/exit markers + MAE/MFE estimates + honesty labels.
 * Cached per entry (fingerprint includes updatedAt → edits invalidate).
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "market_history", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const entryId = new URL(request.url).searchParams.get("entryId") ?? "";
    if (!entryId) return applyNoteCors(jsonError("entryId wajib.", 400), origin);

    const repo = getNoteRepo();
    const entries = await repo.listEntries(auth.session.userId);
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return applyNoteCors(jsonError("Trade tidak ditemukan.", 404), origin);
    if (entry.entryPrice == null || entry.qty == null) {
      return applyNoteCors(jsonOk({ markers: null, mae: null, mfe: null, honesty: ["missing-entry"] }), origin);
    }

    const fingerprint = `${entry.id}:${entry.updatedAt ?? entry.createdAt}:${entry.symbol}`;
    const cache = (await repo.getUserBlob(auth.session.userId, REPLAY_CACHE_BLOB)) as Record<string, CachedReplay> | null;
    const hit = cache?.[entry.id];
    if (hit && hit.fingerprint === fingerprint) {
      return applyNoteCors(jsonOk({ ...hit.payload, cached: true }), origin);
    }

    const ticker = toYahooTicker(entry.symbol);
    const openedAtMs = Date.parse(entry.openedAt);
    // No closedAt on entries: estimate window from open + 7d cap, trimmed by data.
    const closedAtMs = Math.min(Date.now(), openedAtMs + 7 * 24 * 60 * 60_000);
    if (Number.isNaN(openedAtMs)) {
      return applyNoteCors(jsonOk({ markers: null, mae: null, mfe: null, honesty: ["bad-window"] }), origin);
    }
    const side = entry.side.toUpperCase().startsWith("SELL") || entry.side.toUpperCase().startsWith("SHORT") ? "short" : "long";
    const { candles, truncated } = await fetchYahooCandles(ticker, openedAtMs, closedAtMs, "1h");
    const result = computeExcursions(
      { direction: side, qty: entry.qty, entryPrice: entry.entryPrice, openedAtMs, closedAtMs },
      candles,
    );

    const honesty: string[] = ["estimated", "ex-fees-fx"];
    if (truncated) honesty.push("truncated");
    if (result.gaps > 0) honesty.push(`gaps:${result.gaps}`);
    if (result.withheld) honesty.push(`withheld:${result.withheld}`);

    const payload = {
      markers: {
        entry: { t: entry.openedAt, price: entry.entryPrice },
        exit: entry.exitPrice != null ? { price: entry.exitPrice } : null,
      },
      mae: result.mae,
      mfe: result.mfe,
      path: result.path.slice(-120),
      candlesUsed: result.candlesUsed,
      honesty,
    };
    await repo.setUserBlob(auth.session.userId, REPLAY_CACHE_BLOB, {
      ...(cache ?? {}),
      [entry.id]: { fingerprint, payload },
    });
    return applyNoteCors(jsonOk({ ...payload, cached: false }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
