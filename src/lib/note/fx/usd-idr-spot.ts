import { normalizeUsdIdrRate } from "@/lib/note/fx/rates";

const UA = "Mozilla/5.0 (compatible; BursaNote/1.0; +https://bursanalar.com)";

export const USD_IDR_YAHOO_TICKER = "USDIDR=X";

/** Extract spot USD/IDR from Yahoo v8 chart JSON. */
export function parseUsdIdrFromYahooChart(json: unknown): number | null {
  const result = (json as { chart?: { result?: unknown[] } })?.chart?.result?.[0];
  if (!result || typeof result !== "object") return null;
  const meta = (result as { meta?: { regularMarketPrice?: number; previousClose?: number } }).meta;
  const quote = (result as { indicators?: { quote?: Array<{ close?: (number | null)[] }> } }).indicators
    ?.quote?.[0]?.close;
  const fromMeta = meta?.regularMarketPrice;
  if (fromMeta != null && Number.isFinite(fromMeta) && fromMeta > 0) {
    return normalizeUsdIdrRate(fromMeta);
  }
  if (quote?.length) {
    for (let i = quote.length - 1; i >= 0; i -= 1) {
      const c = quote[i];
      if (c != null && Number.isFinite(c) && c > 0) return normalizeUsdIdrRate(c);
    }
  }
  const prev = meta?.previousClose;
  if (prev != null && Number.isFinite(prev) && prev > 0) return normalizeUsdIdrRate(prev);
  return null;
}

/** Latest USD/IDR spot (server-side, Yahoo Finance). */
export async function fetchUsdIdrSpot(): Promise<number | null> {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 86400 * 7;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(USD_IDR_YAHOO_TICKER)}?interval=1d&period1=${period1}&period2=${period2}`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return parseUsdIdrFromYahooChart(json);
}

export const USD_IDR_STALE_MS = 4 * 60 * 60 * 1000;

export function usdIdrRateNeedsRefresh(fetchedAt: string | undefined, manual: boolean): boolean {
  if (manual) return false;
  if (!fetchedAt) return true;
  const t = Date.parse(fetchedAt);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t >= USD_IDR_STALE_MS;
}
