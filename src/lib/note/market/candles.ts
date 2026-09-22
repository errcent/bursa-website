/**
 * Yahoo Finance intraday candles (server-side, $0, no key).
 * Used for trade replay markers and MAE/MFE estimates.
 */

import { normalizeSymbol } from "@/lib/note/market/unified";

const UA = "Mozilla/5.0 (compatible; BursaNote/1.0; +https://bursanalar.com)";

/**
 * Map any user/broker symbol to a Yahoo Finance ticker.
 * Crypto pairs become BTC-USD style; everything else reuses the router.
 */
export function toYahooTicker(input: string): string {
  const s = input.toUpperCase().trim().replace(/[/_-]/g, "");
  const m = s.match(/^([A-Z]+)(USDT|USDC|BUSD)$/);
  if (m) return `${m[1]}-USD`;
  return normalizeSymbol(input);
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface CandleResult {
  candles: Candle[];
  truncated: boolean;
}

interface YahooChartJson {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[]; volume?: (number | null)[] }> };
    }>;
    error?: unknown;
  };
}

export function parseYahooCandles(json: unknown): Candle[] {
  const result = (json as YahooChartJson)?.chart?.result?.[0];
  if (!result) return [];
  const ts = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote) return [];
  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i += 1) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const t = ts[i];
    if (t == null || o == null || h == null || l == null || c == null) continue;
    if (![o, h, l, c].every(Number.isFinite)) continue;
    if (Math.max(o, h, l, c) <= 0) continue;
    out.push({ t: t * 1000, o, h, l, c, v: quote.volume?.[i] ?? 0 });
  }
  return out;
}

const INTERVAL_MS: Record<string, number> = {
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};

/** Fetch candles for [fromMs, toMs]. Caps at 2000 bars (truncated flag beyond). */
export async function fetchYahooCandles(
  ticker: string,
  fromMs: number,
  toMs: number,
  interval: "15m" | "1h" | "1d" = "15m",
): Promise<CandleResult> {
  const period1 = Math.floor(fromMs / 1000);
  const period2 = Math.floor(toMs / 1000);
  if (!(period2 > period1)) return { candles: [], truncated: false };
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=${interval}&period1=${period1}&period2=${period2}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!res.ok) return { candles: [], truncated: false };
    const json = (await res.json().catch(() => null)) as unknown;
    const all = parseYahooCandles(json);
    const step = INTERVAL_MS[interval] ?? INTERVAL_MS["15m"]!;
    const inRange = all.filter((c) => c.t >= fromMs - step && c.t <= toMs + step);
    const truncated = inRange.length > 2000;
    return { candles: truncated ? inRange.slice(0, 2000) : inRange, truncated };
  } catch {
    return { candles: [], truncated: false };
  } finally {
    clearTimeout(timer);
  }
}
