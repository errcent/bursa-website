import type { EconFilterCurrency } from "@/lib/note/economic-calendar/filters";
import {
  currencyForSymbol,
  defaultSymbolForCurrency,
  pairsForCurrency,
} from "@/lib/note/tradingview/symbols";

export type NewsChartLayout = "1" | "2-col" | "2-row" | "grid";

export type NewsChartPane = {
  currency: EconFilterCurrency;
  symbol: string;
};

export type NewsChartPrefs = {
  layout: NewsChartLayout;
  panes: NewsChartPane[];
};

const STORAGE_KEY = "note-news-charts-v1";

export function paneCountForLayout(layout: NewsChartLayout): number {
  if (layout === "1") return 1;
  if (layout === "grid") return 4;
  return 2;
}

export function loadChartPrefs(): NewsChartPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NewsChartPrefs;
  } catch {
    return null;
  }
}

export function saveChartPrefs(prefs: NewsChartPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** Pane i is bound to filter currency pool[i % pool.length] (single-pane multi-ccy: pair pick only). */
export function reconcileChartPrefs(
  prev: NewsChartPrefs | null,
  layout: NewsChartLayout,
  filterCurrencies: EconFilterCurrency[]
): NewsChartPrefs {
  const n = paneCountForLayout(layout);
  const pool = filterCurrencies.length ? filterCurrencies : (["USD"] as EconFilterCurrency[]);
  const panes: NewsChartPane[] = [];
  const singleMulti = layout === "1" && pool.length > 1;

  for (let i = 0; i < n; i += 1) {
    const slotCurrency = pool[i % pool.length];
    const fromPrev = prev?.panes[i];
    const allowed = new Set(pairsForCurrency(slotCurrency).map((p) => p.id));
    let symbol = defaultSymbolForCurrency(slotCurrency);

    if (singleMulti && fromPrev?.symbol && currencyForSymbol(fromPrev.symbol, pool)) {
      symbol = fromPrev.symbol;
    } else if (!singleMulti && fromPrev?.currency === slotCurrency && fromPrev.symbol && allowed.has(fromPrev.symbol)) {
      symbol = fromPrev.symbol;
    }

    const currency = singleMulti
      ? (currencyForSymbol(symbol, pool) ?? pool[0])
      : slotCurrency;
    panes.push({ currency, symbol });
  }

  return { layout, panes };
}
