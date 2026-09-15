/** Map Track symbols to Yahoo Finance tickers for daily OHLC. */
const YAHOO: Record<string, string> = {
  BTCUSD: "BTC-USD",
  ETHUSD: "ETH-USD",
  XAUUSD: "GC=F",
  XAGUSD: "SI=F",
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "JPY=X",
  AUDUSD: "AUDUSD=X",
  BBCA: "BBCA.JK",
  BBRI: "BBRI.JK",
  TLKM: "TLKM.JK",
  ASII: "ASII.JK",
};

export function yahooTickerForSymbol(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  return YAHOO[s] ?? null;
}

export function trackSymbolsNeedingYahoo(symbols: string[]): string[] {
  const out = new Set<string>();
  for (const sym of symbols) {
    const t = yahooTickerForSymbol(sym);
    if (t) out.add(sym.trim().toUpperCase());
  }
  return [...out];
}
