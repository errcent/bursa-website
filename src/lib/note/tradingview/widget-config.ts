/**
 * TradingView **embed widgets** (not Charting Library).
 * Docs: https://www.tradingview.com/widget-docs/widgets/charts/
 *
 * Pattern:
 * 1. Outer `.tradingview-widget-container` (sized by host page).
 * 2. Inner `.tradingview-widget-container__widget` (chart mounts here; leave ~32px for copyright).
 * 3. Optional `.tradingview-widget-copyright` link (attribution).
 * 4. `<script src="https://s3.tradingview.com/external-embedding/embed-widget-*.js" async>`
 *    with **JSON body** (not constructor) - the loader reads script text as widget config.
 *
 * Chart family (same page in widget-docs):
 * - advanced-chart - full interactive chart (what Note News uses)
 * - symbol-overview - quote + mini chart
 * - mini-chart - strip chart
 * - market-overview / market-summary - multi-symbol boards
 */

export const TV_EMBED_ADVANCED_CHART =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

export type TvEmbedLocale = "id" | "en";

/** Config for Advanced Real-Time Chart widget (embed JSON). */
export type AdvancedChartEmbedConfig = {
  autosize: boolean;
  symbol: string;
  interval: string;
  timezone: string;
  theme: "dark" | "light";
  style: string;
  locale: string;
  allow_symbol_change: boolean;
  calendar: boolean;
  support_host: string;
  backgroundColor?: string;
  withdateranges?: boolean;
  hide_side_toolbar?: boolean;
  save_image?: boolean;
};

export function buildAdvancedChartEmbedConfig(
  symbol: string,
  locale: TvEmbedLocale
): AdvancedChartEmbedConfig {
  return {
    autosize: true,
    symbol,
    interval: "15",
    timezone: "Asia/Jakarta",
    theme: "dark",
    backgroundColor: "rgba(9, 9, 11, 1)",
    style: "1",
    locale: locale === "id" ? "id" : "en",
    allow_symbol_change: false,
    calendar: false,
    withdateranges: true,
    hide_side_toolbar: false,
    save_image: false,
    support_host: "https://www.tradingview.com",
  };
}

/** `FX:EURUSD` → `https://www.tradingview.com/symbols/EURUSD/` (exchange in path when needed). */
export function tradingViewSymbolPageUrl(symbol: string): string {
  const [exchange, ticker] = symbol.includes(":") ? symbol.split(":", 2) : ["", symbol];
  const slug = ticker.replace(/[/\\]/g, "-");
  if (exchange) {
    return `https://www.tradingview.com/symbols/${exchange}-${slug}/`;
  }
  return `https://www.tradingview.com/symbols/${slug}/`;
}

export function tradingViewSymbolLabel(symbol: string): string {
  const part = symbol.split(":").pop() ?? symbol;
  return part.replace(/([A-Z]{3})([A-Z]{3})/, "$1/$2");
}
