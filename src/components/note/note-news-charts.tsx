"use client";

import { ChevronDown, LayoutGrid, PanelLeft, PanelTop, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TradingViewAdvancedChart } from "@/components/note/tradingview-advanced-chart";
import type { EconFilterCurrency } from "@/lib/note/economic-calendar/filters";
import { noteCopy } from "@/lib/note/copy";
import {
  loadChartPrefs,
  paneCountForLayout,
  reconcileChartPrefs,
  saveChartPrefs,
  type NewsChartLayout,
  type NewsChartPrefs,
} from "@/lib/note/tradingview/chart-prefs";
import {
  currenciesForCharts,
  currencyForSymbol,
  isBroadCurrencyFilter,
  pairsForCurrency,
} from "@/lib/note/tradingview/symbols";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const LAYOUTS: { id: NewsChartLayout; icon: typeof Square; label: Record<"id" | "en", string> }[] = [
  { id: "1", icon: Square, label: { id: "1", en: "1" } },
  { id: "2-col", icon: PanelLeft, label: { id: "2↔", en: "2↔" } },
  { id: "2-row", icon: PanelTop, label: { id: "2↕", en: "2↕" } },
  { id: "grid", icon: LayoutGrid, label: { id: "4", en: "4" } },
];

type Props = {
  filterCurrencies: EconFilterCurrency[];
  embedded?: boolean;
};

export function NoteNewsCharts({ filterCurrencies, embedded = false }: Props) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const locale = prefs.locale;

  const pool = useMemo(() => currenciesForCharts(filterCurrencies), [filterCurrencies]);
  const broadFilter = isBroadCurrencyFilter(filterCurrencies);

  const [chartPrefs, setChartPrefs] = useState<NewsChartPrefs>(() =>
    reconcileChartPrefs(null, "1", pool)
  );

  useEffect(() => {
    const stored = loadChartPrefs();
    setChartPrefs(reconcileChartPrefs(stored, stored?.layout ?? "1", pool));
  }, [pool]);

  const persist = useCallback((next: NewsChartPrefs) => {
    setChartPrefs(next);
    saveChartPrefs(next);
  }, []);

  const setLayout = (layout: NewsChartLayout) => {
    persist(reconcileChartPrefs(chartPrefs, layout, pool));
  };

  const updatePaneSymbol = (index: number, symbol: string) => {
    const panes = [...chartPrefs.panes];
    const cur = panes[index];
    if (!cur) return;
    const currency = currencyForSymbol(symbol, pool) ?? cur.currency;
    panes[index] = { currency, symbol };
    persist({ ...chartPrefs, panes });
  };

  const visiblePanes = chartPrefs.panes.slice(0, paneCountForLayout(chartPrefs.layout));
  const singlePaneMultiCurrency = chartPrefs.layout === "1" && pool.length > 1;

  const gridClass =
    chartPrefs.layout === "1"
      ? "grid-cols-1"
      : chartPrefs.layout === "2-col"
        ? "grid-cols-1 md:grid-cols-2"
        : chartPrefs.layout === "2-row"
          ? "grid-cols-1"
          : "grid-cols-1 md:grid-cols-2";

  const paneCurrency = (index: number) => pool[index % pool.length];

  const layoutToolbar = (
    <div
      className="flex shrink-0 rounded-md border border-zinc-800/80 bg-zinc-950/80 p-0.5"
      role="group"
      aria-label={copy.newsChartsLayout}
    >
      {LAYOUTS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label[locale]}
          onClick={() => setLayout(id)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded transition-colors",
            chartPrefs.layout === id ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-2", !embedded && "rounded-xl border border-zinc-800/80 p-3 sm:p-4")}>
      {broadFilter ? (
        <p className="note-warn-body text-[10px] opacity-75">{copy.newsChartsBroadFilter}</p>
      ) : null}

      <div className={cn("grid gap-2", gridClass)}>
        {visiblePanes.map((pane, index) => {
          const badge = singlePaneMultiCurrency
            ? (currencyForSymbol(pane.symbol, pool) ?? pool[0])
            : paneCurrency(index);
          return (
            <div
              key={`${pane.symbol}-${index}`}
              className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40"
            >
              <div className="flex items-center gap-2 border-b border-zinc-800/70 px-2 py-1.5 sm:px-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  {!singlePaneMultiCurrency ? (
                    <span className="note-warn-body shrink-0 text-[11px] font-semibold tabular-nums opacity-90">
                      {badge}
                    </span>
                  ) : null}
                  <div className="relative inline-flex min-w-0 max-w-[12rem] items-center rounded-md border border-zinc-700/90 bg-zinc-900 pl-2 pr-7 shadow-sm transition-colors hover:border-zinc-600 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600">
                    <select
                      value={pane.symbol}
                      onChange={(e) => updatePaneSymbol(index, e.target.value)}
                      className="w-full min-w-0 cursor-pointer appearance-none border-0 bg-transparent py-1 text-[13px] font-medium text-zinc-100 outline-none [&>optgroup]:bg-zinc-900 [&>optgroup]:text-zinc-400 [&>option]:bg-zinc-900 [&>option]:text-zinc-100"
                      aria-label={`${copy.newsChartsPair} ${index + 1}`}
                    >
                      {singlePaneMultiCurrency
                        ? pool.map((c) => (
                            <optgroup key={c} label={c}>
                              {pairsForCurrency(c).map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label[locale]}
                                </option>
                              ))}
                            </optgroup>
                          ))
                        : pairsForCurrency(badge).map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label[locale]}
                            </option>
                          ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400"
                      aria-hidden
                    />
                  </div>
                </div>
                {index === 0 ? layoutToolbar : null}
              </div>
              <div className="h-[300px] sm:h-[340px]">
                <TradingViewAdvancedChart symbol={pane.symbol} locale={locale} className="h-full w-full" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
