/**
 * Yahoo Finance price fetcher ($0, no API key).
 *
 * Works for:
 * - US stocks: AAPL, MSFT, TSLA
 * - IDX stocks: BBCA.JK, TLKM.JK, ASII.JK
 * - Forex: EURUSD=X, USDIDR=X, GBPUSD=X
 * - Commodities: GC=F (gold), CL=F (crude)
 *
 * Yahoo's v8 chart endpoint is unofficial but stable and free.
 * Returns: { price, previousClose, changePct, currency }
 */

const UA = "Mozilla/5.0 (compatible; BursaNote/1.0; +https://bursanalar.com)";

export interface YahooQuote {
  symbol: string;
  price: number;
  previousClose: number;
  changePct: number;
  currency: string;
}

export function parseYahooQuote(symbol: string, json: unknown): YahooQuote | null {
  const result = (json as { chart?: { result?: unknown[] } })?.chart?.result?.[0];
  if (!result || typeof result !== "object") return null;
  const meta = (result as {
    meta?: {
      regularMarketPrice?: number;
      previousClose?: number;
      currency?: string;
    };
  }).meta;
  const price = meta?.regularMarketPrice;
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  const prev = meta?.previousClose ?? price;
  const changePct = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  return {
    symbol,
    price,
    previousClose: prev,
    changePct,
    currency: meta?.currency ?? "USD",
  };
}

export async function fetchYahooQuote(symbol: string): Promise<YahooQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return parseYahooQuote(symbol, json);
  } catch {
    return null;
  }
}

/** Batch fetch (Yahoo supports multiple symbols via comma-join, but we parallelize for safety). */
export async function fetchYahooQuotes(symbols: string[]): Promise<Record<string, YahooQuote | null>> {
  const results = await Promise.all(
    symbols.map(async (s) => [s, await fetchYahooQuote(s)] as const)
  );
  return Object.fromEntries(results);
}

/** Detect if a symbol is likely a Yahoo Finance ticker. */
export function isYahooSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase().trim();
  // IDX stocks end with .JK
  if (s.endsWith(".JK")) return true;
  // Forex pairs end with =X
  if (s.endsWith("=X")) return true;
  // Futures end with =F
  if (s.endsWith("=F")) return true;
  // US stock tickers (1-5 uppercase letters)
  if (/^[A-Z]{1,5}$/.test(s)) return true;
  // Crypto via Yahoo (BTC-USD, ETH-USD)
  if (/^[A-Z]+-[A-Z]{3}$/.test(s)) return true;
  return false;
}
