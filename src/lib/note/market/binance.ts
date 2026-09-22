/**
 * Binance public API price fetcher ($0, no API key).
 *
 * Works for all crypto pairs on Binance:
 * - BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT
 * - BTCIDR, ETHIDR (Binance Indonesia)
 *
 * Binance public REST endpoints are free, no key, no rate limit for simple price.
 * WebSocket available for real-time streaming (future).
 */

export interface BinanceQuote {
  symbol: string;
  price: number;
  changePct: number;
  currency: string;
}

export async function fetchBinanceQuote(symbol: string): Promise<BinanceQuote | null> {
  const s = symbol.toUpperCase().replace(/[/_-]/g, "");
  // 24h ticker: https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(s)}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as {
      lastPrice?: string;
      priceChangePercent?: string;
      quoteAsset?: string;
    } | null;
    if (!json?.lastPrice) return null;
    const price = Number(json.lastPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      symbol: s,
      price,
      changePct: Number(json.priceChangePercent ?? 0),
      currency: json.quoteAsset ?? "USDT",
    };
  } catch {
    return null;
  }
}

export async function fetchBinanceQuotes(symbols: string[]): Promise<Record<string, BinanceQuote | null>> {
  const results = await Promise.all(
    symbols.map(async (s) => [s, await fetchBinanceQuote(s)] as const)
  );
  return Object.fromEntries(results);
}

/** Detect if a symbol is a Binance crypto pair. */
export function isBinanceSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase().replace(/[/_-]/g, "");
  // Common quote assets: USDT, USDC, BUSD, BNB, IDR, BTC, ETH
  return /(USDT|USDC|BUSD|IDR|BNB|BTC|ETH)$/.test(s) && s.length >= 6;
}
