import { dayKey, NOTE_TZ } from "@/lib/note/stats";

import { yahooTickerForSymbol } from "@/lib/note/track/yahoo-symbols";

export type DailyCloseSeries = Record<string, Record<string, number>>;

const UA =
  "Mozilla/5.0 (compatible; BursaNote/1.0; +https://bursanalar.com)";

function jakartaDayFromUnix(sec: number): string {
  return dayKey(new Date(sec * 1000).toISOString(), NOTE_TZ);
}

/** Fetch daily close prices from Yahoo chart API (server-side). */
export async function fetchYahooDailyCloses(
  symbol: string,
  fromDate: string,
  toDate: string
): Promise<Record<string, number>> {
  const ticker = yahooTickerForSymbol(symbol);
  if (!ticker) return {};

  const period1 = Math.floor(new Date(`${fromDate}T00:00:00Z`).getTime() / 1000);
  const period2 = Math.floor(new Date(`${toDate}T23:59:59Z`).getTime() / 1000) + 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${period1}&period2=${period2}`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return {};

  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: (number | null)[] }> };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const out: Record<string, number> = {};

  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    const ts = timestamps[i];
    if (close == null || ts == null || !Number.isFinite(close)) continue;
    const d = jakartaDayFromUnix(ts);
    if (d < fromDate || d > toDate) continue;
    out[d] = close;
  }
  return out;
}

export async function fetchTrackMarketCloses(
  symbols: string[],
  fromDate: string,
  toDate: string
): Promise<DailyCloseSeries> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (sym) => {
      const closes = await fetchYahooDailyCloses(sym, fromDate, toDate);
      return [sym, closes] as const;
    })
  );
  const series: DailyCloseSeries = {};
  for (const [sym, closes] of entries) {
    if (Object.keys(closes).length) series[sym] = closes;
  }
  return series;
}

/** Last available close on or before `date`. */
export function closeOnOrBefore(series: Record<string, number>, date: string): number | null {
  if (series[date] != null) return series[date]!;
  let best: string | null = null;
  for (const d of Object.keys(series)) {
    if (d <= date && (!best || d > best)) best = d;
  }
  return best ? series[best]! : null;
}
