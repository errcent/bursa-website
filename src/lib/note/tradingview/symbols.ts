import {
  ECON_FILTER_CURRENCIES,
  type EconFilterCurrency,
} from "@/lib/note/economic-calendar/filters";

export type TvSymbolOption = {
  id: string;
  label: Record<"id" | "en", string>;
};

const PAIRS: Record<EconFilterCurrency, TvSymbolOption[]> = {
  USD: [
    { id: "FX:EURUSD", label: { id: "EUR/USD", en: "EUR/USD" } },
    { id: "FX:GBPUSD", label: { id: "GBP/USD", en: "GBP/USD" } },
    { id: "FX:USDJPY", label: { id: "USD/JPY", en: "USD/JPY" } },
    { id: "OANDA:XAUUSD", label: { id: "XAU/USD", en: "XAU/USD" } },
    { id: "COINBASE:BTCUSD", label: { id: "BTC/USD", en: "BTC/USD" } },
    { id: "BINANCE:BTCUSDT", label: { id: "BTC/USDT", en: "BTC/USDT" } },
    { id: "BINANCE:ETHUSDT", label: { id: "ETH/USDT", en: "ETH/USDT" } },
  ],
  EUR: [
    { id: "FX:EURUSD", label: { id: "EUR/USD", en: "EUR/USD" } },
    { id: "FX:EURGBP", label: { id: "EUR/GBP", en: "EUR/GBP" } },
    { id: "FX:EURJPY", label: { id: "EUR/JPY", en: "EUR/JPY" } },
    { id: "FX:EURCHF", label: { id: "EUR/CHF", en: "EUR/CHF" } },
  ],
  GBP: [
    { id: "FX:GBPUSD", label: { id: "GBP/USD", en: "GBP/USD" } },
    { id: "FX:EURGBP", label: { id: "EUR/GBP", en: "EUR/GBP" } },
    { id: "FX:GBPJPY", label: { id: "GBP/JPY", en: "GBP/JPY" } },
  ],
  JPY: [
    { id: "FX:USDJPY", label: { id: "USD/JPY", en: "USD/JPY" } },
    { id: "FX:EURJPY", label: { id: "EUR/JPY", en: "EUR/JPY" } },
    { id: "FX:GBPJPY", label: { id: "GBP/JPY", en: "GBP/JPY" } },
  ],
  AUD: [
    { id: "FX:AUDUSD", label: { id: "AUD/USD", en: "AUD/USD" } },
    { id: "FX:AUDJPY", label: { id: "AUD/JPY", en: "AUD/JPY" } },
    { id: "FX:EURAUD", label: { id: "EUR/AUD", en: "EUR/AUD" } },
  ],
  CAD: [
    { id: "FX:USDCAD", label: { id: "USD/CAD", en: "USD/CAD" } },
    { id: "FX:CADJPY", label: { id: "CAD/JPY", en: "CAD/JPY" } },
  ],
  CHF: [
    { id: "FX:USDCHF", label: { id: "USD/CHF", en: "USD/CHF" } },
    { id: "FX:EURCHF", label: { id: "EUR/CHF", en: "EUR/CHF" } },
  ],
  NZD: [
    { id: "FX:NZDUSD", label: { id: "NZD/USD", en: "NZD/USD" } },
    { id: "FX:NZDJPY", label: { id: "NZD/JPY", en: "NZD/JPY" } },
  ],
  CNY: [
    { id: "FX:USDCNH", label: { id: "USD/CNH", en: "USD/CNH" } },
    { id: "FX:EURCNH", label: { id: "EUR/CNH", en: "EUR/CNH" } },
  ],
};

export function pairsForCurrency(currency: EconFilterCurrency): TvSymbolOption[] {
  return PAIRS[currency] ?? PAIRS.USD;
}

export function defaultSymbolForCurrency(currency: EconFilterCurrency): string {
  return pairsForCurrency(currency)[0]?.id ?? "FX:EURUSD";
}

/** When calendar filter is “all currencies”, charts default to USD until user narrows. */
export function currenciesForCharts(currencies: EconFilterCurrency[]): EconFilterCurrency[] {
  if (!currencies.length) return ["USD"];
  if (currencies.length >= ECON_FILTER_CURRENCIES.length) return ["USD"];
  return currencies.slice(0, 4);
}

export function isBroadCurrencyFilter(currencies: EconFilterCurrency[]): boolean {
  return currencies.length >= ECON_FILTER_CURRENCIES.length;
}

export function currencyForSymbol(
  symbol: string,
  allowed: EconFilterCurrency[]
): EconFilterCurrency | null {
  for (const c of allowed) {
    if (pairsForCurrency(c).some((p) => p.id === symbol)) return c;
  }
  return null;
}

export function allPairsForFilterCurrencies(
  currencies: EconFilterCurrency[]
): { currency: EconFilterCurrency; option: TvSymbolOption }[] {
  const out: { currency: EconFilterCurrency; option: TvSymbolOption }[] = [];
  for (const c of currencies) {
    for (const option of pairsForCurrency(c)) {
      out.push({ currency: c, option });
    }
  }
  return out;
}

/** IDX (Bursa Efek Indonesia) stock symbols for TradingView. */
export const IDX_STOCK_SYMBOLS: TvSymbolOption[] = [
  { id: "IDX:BBCA", label: { id: "BBCA", en: "BBCA" } },
  { id: "IDX:TLKM", label: { id: "TLKM", en: "TLKM" } },
  { id: "IDX:ASII", label: { id: "ASII", en: "ASII" } },
  { id: "IDX:GGRM", label: { id: "GGRM", en: "GGRM" } },
  { id: "IDX:UNVR", label: { id: "UNVR", en: "UNVR" } },
  { id: "IDX:BMRI", label: { id: "BMRI", en: "BMRI" } },
  { id: "IDX:ICBP", label: { id: "ICBP", en: "ICBP" } },
  { id: "IDX:ADRO", label: { id: "ADRO", en: "ADRO" } },
  { id: "IDX:ANTM", label: { id: "ANTM", en: "ANTM" } },
  { id: "IDX:PGAS", label: { id: "PGAS", en: "PGAS" } },
];

/** Crypto pairs for TradingView (Binance + Coinbase). */
export const CRYPTO_SYMBOLS: TvSymbolOption[] = [
  { id: "BINANCE:BTCUSDT", label: { id: "BTC/USDT", en: "BTC/USDT" } },
  { id: "BINANCE:ETHUSDT", label: { id: "ETH/USDT", en: "ETH/USDT" } },
  { id: "BINANCE:BNBUSDT", label: { id: "BNB/USDT", en: "BNB/USDT" } },
  { id: "BINANCE:SOLUSDT", label: { id: "SOL/USDT", en: "SOL/USDT" } },
  { id: "BINANCE:XRPUSDT", label: { id: "XRP/USDT", en: "XRP/USDT" } },
  { id: "BINANCE:DOGEUSDT", label: { id: "DOGE/USDT", en: "DOGE/USDT" } },
  { id: "COINBASE:BTCUSD", label: { id: "BTC/USD", en: "BTC/USD" } },
  { id: "COINBASE:ETHUSD", label: { id: "ETH/USD", en: "ETH/USD" } },
];

/** US stock symbols for TradingView. */
export const US_STOCK_SYMBOLS: TvSymbolOption[] = [
  { id: "NASDAQ:AAPL", label: { id: "AAPL", en: "AAPL" } },
  { id: "NASDAQ:MSFT", label: { id: "MSFT", en: "MSFT" } },
  { id: "NASDAQ:TSLA", label: { id: "TSLA", en: "TSLA" } },
  { id: "NASDAQ:NVDA", label: { id: "NVDA", en: "NVDA" } },
  { id: "NASDAQ:AMZN", label: { id: "AMZN", en: "AMZN" } },
  { id: "NASDAQ:GOOGL", label: { id: "GOOGL", en: "GOOGL" } },
];
