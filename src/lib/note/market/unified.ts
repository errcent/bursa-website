/**
 * Unified market data router ($0, no API keys).
 *
 * Routes a symbol to the correct free data source:
 * - Crypto (XXXUSDT, XXXIDR, BTC/USDT) → Binance public API
 * - Forex (EURUSD=X, USDIDR=X) → Yahoo Finance
 * - US stocks (AAPL, MSFT) → Yahoo Finance
 * - IDX stocks (BBCA.JK, TLKM.JK) → Yahoo Finance
 * - Commodities (GC=F, CL=F) → Yahoo Finance
 *
 * TradingView widgets already provide real-time CHARTS.
 * This module provides real-time PRICE DATA for PnL calc, Track page, etc.
 */

import { fetchYahooQuote, isYahooSymbol, type YahooQuote } from "@/lib/note/market/yahoo";
import { fetchBinanceQuote, isBinanceSymbol, type BinanceQuote } from "@/lib/note/market/binance";

export type MarketSource = "binance" | "yahoo";

export interface UnifiedQuote {
  symbol: string;
  source: MarketSource;
  price: number;
  previousClose?: number;
  changePct: number;
  currency: string;
}

export function detectSource(symbol: string): MarketSource {
  const s = symbol.toUpperCase().trim();
  // Binance crypto pairs
  if (isBinanceSymbol(s)) return "binance";
  // Yahoo: forex, stocks, IDX, commodities
  if (isYahooSymbol(s)) return "yahoo";
  // Default: try Yahoo
  return "yahoo";
}

export async function fetchQuote(symbol: string): Promise<UnifiedQuote | null> {
  const source = detectSource(symbol);
  try {
    if (source === "binance") {
      const q = await fetchBinanceQuote(symbol);
      if (q) {
        return {
          symbol: q.symbol,
          source: "binance",
          price: q.price,
          changePct: q.changePct,
          currency: q.currency,
        };
      }
      // Binance unreachable → fall back to Yahoo for crypto (BTC-USD, ETH-USD)
      const yahooCrypto = binanceToYahooCrypto(symbol);
      if (yahooCrypto) {
        const yq = await fetchYahooQuote(yahooCrypto);
        if (yq) {
          return {
            symbol: yq.symbol,
            source: "yahoo",
            price: yq.price,
            previousClose: yq.previousClose,
            changePct: yq.changePct,
            currency: yq.currency,
          };
        }
      }
      return null;
    }
    const q: YahooQuote | null = await fetchYahooQuote(symbol);
    if (!q) return null;
    return {
      symbol: q.symbol,
      source: "yahoo",
      price: q.price,
      previousClose: q.previousClose,
      changePct: q.changePct,
      currency: q.currency,
    };
  } catch {
    return null;
  }
}

/** Convert Binance crypto pair to Yahoo Finance ticker for fallback. */
function binanceToYahooCrypto(symbol: string): string | null {
  const s = symbol.toUpperCase().replace(/[/_-]/g, "");
  // BTCUSDT → BTC-USD, ETHUSDT → ETH-USD
  const m = s.match(/^([A-Z]+)(USDT|USD|USDC|BUSD)$/);
  if (m) {
    return `${m[1]}-USD`;
  }
  return null;
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, UnifiedQuote | null>> {
  const results = await Promise.all(
    symbols.map(async (s) => [s, await fetchQuote(s)] as const)
  );
  return Object.fromEntries(results);
}

/**
 * Normalize a user-entered symbol to the correct format for the data source.
 * Examples:
 *   "BTCUSDT" → "BTCUSDT" (Binance)
 *   "BTC/USDT" → "BTCUSDT" (Binance)
 *   "EURUSD" → "EURUSD=X" (Yahoo)
 *   "BBCA" → "BBCA.JK" (Yahoo IDX)
 *   "AAPL" → "AAPL" (Yahoo US)
 */
export function normalizeSymbol(input: string): string {
  const s = input.toUpperCase().trim();
  // Already has exchange prefix (FX:, BINANCE:, IDX:)
  if (s.includes(":")) return s.split(":")[1] ?? s;
  // Forex without =X
  if (/^[A-Z]{3}[A-Z]{3}$/.test(s) && !s.endsWith("=X")) {
    // Could be forex (EURUSD) or crypto (BTCUSDT) — check USDT/USDC suffix
    if (/(USDT|USDC|BUSD)$/.test(s)) return s; // Binance
    return `${s}=X`; // Yahoo forex
  }
  // IDX stock without .JK suffix (assume IDX for common ID tickers)
  const idTickers = ["BBCA", "TLKM", "ASII", "GGRM", "UNVR", "BMRI", "ICBP", "MBTO", "ADRO", "ANTM", "PGAS", "TPIA", "UNTR", "INDF"];
  if (idTickers.includes(s)) return `${s}.JK`;
  // Crypto with slash: BTC/USDT → BTCUSDT
  if (s.includes("/")) return s.replace("/", "");
  return s;
}
