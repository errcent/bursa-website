import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { applyNoteCors, noteCorsPreflight } from "@/lib/note/guard";
import { fetchQuote, fetchQuotes, normalizeSymbol } from "@/lib/note/market/unified";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

/** GET /api/note/market/quote?symbol=BTCUSDT
 *  GET /api/note/market/quote?symbols=BTCUSDT,EURUSD, BBCA
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const single = url.searchParams.get("symbol");
  const multi = url.searchParams.get("symbols");

  try {
    if (single) {
      const sym = normalizeSymbol(single);
      const quote = await fetchQuote(sym);
      if (!quote) {
        return applyNoteCors(jsonError("Quote not found.", 404), origin);
      }
      return applyNoteCors(jsonOk(quote), origin);
    }

    if (multi) {
      const symbols = multi.split(",").map((s) => normalizeSymbol(s.trim())).filter(Boolean);
      const quotes = await fetchQuotes(symbols);
      return applyNoteCors(jsonOk(quotes), origin);
    }

    return applyNoteCors(jsonError("Pass symbol= or symbols= query param.", 400), origin);
  } catch (error) {
    return applyNoteCors(jsonError("Market data fetch failed.", 500), origin);
  }
}
