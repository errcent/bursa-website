import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { clampMarketHistoryQuery, MARKET_HISTORY_MAX_SYMBOLS } from "@/lib/note/query-bounds";
import { fetchTrackMarketCloses } from "@/lib/note/track/yahoo-history";
import { trackSymbolsNeedingYahoo } from "@/lib/note/track/yahoo-symbols";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "market_history", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  const from = request.nextUrl.searchParams.get("from")?.trim();
  const to = request.nextUrl.searchParams.get("to")?.trim();
  const rawSymbols = request.nextUrl.searchParams.get("symbols")?.trim();

  if (!from || !to || !rawSymbols) {
    return applyNoteCors(jsonError("Missing from, to, or symbols", 400), origin);
  }

  const symbols = trackSymbolsNeedingYahoo(rawSymbols.split(",")).slice(0, MARKET_HISTORY_MAX_SYMBOLS);
  if (!symbols.length) {
    return applyNoteCors(jsonOk({ series: {}, source: "yahoo" }), origin);
  }

  const bounds = clampMarketHistoryQuery(from, to, symbols.length);
  if (!bounds.ok) {
    return applyNoteCors(jsonError(bounds.reason, 400), origin);
  }

  try {
    const series = await fetchTrackMarketCloses(symbols, bounds.from, bounds.to);
    const res = jsonOk({
      series,
      source: "yahoo",
      fetchedAt: new Date().toISOString(),
    });
    res.headers.set("Cache-Control", "private, max-age=300");
    return applyNoteCors(res, origin);
  } catch {
    return applyNoteCors(jsonError("Market history fetch failed", 502), origin);
  }
}
