"use client";

import { useMemo, useState } from "react";

import { NoteLoadingLine } from "@/components/note/note-loading-line";
import {
  NoteTrackProvider,
  useNoteTrack,
  useScopedTransactions,
} from "@/components/note/track/note-track-context";
import {
  AddTransactionDialog,
  CreatePortfolioDialog,
} from "@/components/note/track/note-track-dialogs";
import {
  TrackAllocationOverTime,
  TrackAllocationPie,
  TrackHistoryLine,
} from "@/components/note/track/note-track-charts";
import { formatTrackDateTime } from "@/lib/note/track/datetime";
import { buildTrackSnapshot } from "@/lib/note/track/engine";
import { useTrackMarketCloses } from "@/lib/note/track/use-market-closes";
import { useLiveQuotes } from "@/lib/note/market/use-live-quotes";
import { normalizeSymbol } from "@/lib/note/market/unified";
import { jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import type { TrackRangePreset } from "@/lib/note/track/types";
import { fxContextFromPrefs } from "@/lib/note/fx/context";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { formatPnl } from "@/lib/note/stats";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

function formatTrackQty(n: number): string {
  if (!Number.isFinite(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (abs >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-zinc-200">{children}</h2>
  );
}

function TrackInner() {
  const [prefs] = useNotePrefs();
  const locale = prefs.locale;
  const formatOpts = pnlOptsFromPrefs(prefs);
  const fx = useMemo(() => fxContextFromPrefs(prefs), [prefs]);
  const { store, scope, setScope, loading, demo } = useNoteTrack();
  const copy = noteCopy(locale);
  const txns = useScopedTransactions();
  const [range, setRange] = useState<TrackRangePreset>("30d");
  const [showCreatePf, setShowCreatePf] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);

  const t = (id: string, en: string) => (locale === "en" ? en : id);

  const anchor = jakartaDateKey();
  const marketFrom = useMemo(() => {
    const start = txns[0]?.executedAt.slice(0, 10) ?? anchor;
    return start;
  }, [txns, anchor]);

  const { series: marketCloses, loading: marketLoading } = useTrackMarketCloses(txns, marketFrom, anchor);

  const snap = useMemo(
    () =>
      buildTrackSnapshot(txns, {
        range,
        baseCurrency: fx.display,
        rates: fx.rates,
        marketCloses,
      }),
    [txns, range, fx, marketCloses]
  );
  const symbols = useMemo(() => snap.holdings.map((h) => h.symbol), [snap.holdings]);
  const liveSymbols = useMemo(() => symbols.map((s) => normalizeSymbol(s)), [symbols]);
  const { quotes: liveQuotes } = useLiveQuotes(liveSymbols);
  const recentTx = useMemo(
    () => [...txns].sort((a, b) => b.executedAt.localeCompare(a.executedAt)).slice(0, 10),
    [txns]
  );

  const txPortfolioId = scope === "all" ? null : scope;

  if (loading) {
    return <NoteLoadingLine />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      {demo ? (
        <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs leading-snug text-zinc-300">
          {copy.trackDemo}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="track-portfolio-scope" className="block text-xs text-zinc-400">
            {t("Portfolio", "Portfolio")}
            <select
              id="track-portfolio-scope"
              className="mt-1 block min-h-11 w-full max-w-sm rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100"
              value={scope}
              onChange={(e) => setScope(e.target.value as "all" | string)}
            >
              <option value="all">{copy.trackAllPortfolios}</option>
              {store.portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {(["7d", "30d", "90d", "ytd", "all"] as TrackRangePreset[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md border px-3 text-xs uppercase",
                  range === r ? "border-zinc-500 bg-zinc-800 text-zinc-200" : "border-zinc-800 text-zinc-400"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 hover:bg-white"
            onClick={() => (scope === "all" ? setShowCreatePf(true) : setShowAddTx(true))}
          >
            {scope === "all" ? copy.trackCreate : copy.trackAddTx}
          </button>
        </div>
      </div>

      <p className="text-xs leading-snug text-zinc-400">
        {snap.marketDataUsed
          ? locale === "en"
            ? "History uses Yahoo Finance daily closes where available."
            : "History memakai close harian Yahoo Finance bila tersedia."
          : marketLoading
            ? locale === "en"
              ? "Loading market prices…"
              : "Memuat harga pasar…"
            : null}
      </p>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3 lg:col-span-2">
          <p className="text-xs text-zinc-400">{t("Nilai portfolio", "Portfolio value")}</p>
          <p className="font-heading text-3xl tabular-nums tracking-tight text-zinc-50">
            {formatPnl(snap.totalValue, formatOpts)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-400">{t("All-time P/L", "All-time P/L")}</p>
          <p className={cn("text-xl tabular-nums font-medium", snap.allTimePnl >= 0 ? "note-pnl-up" : "note-pnl-down")}>
            {formatPnl(snap.allTimePnl, formatOpts)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-400">
            {t("Periode", "Period")} ({range})
          </p>
          <p className={cn("text-xl tabular-nums font-medium", snap.rangePnl >= 0 ? "note-pnl-up" : "note-pnl-down")}>
            {formatPnl(snap.rangePnl, formatOpts)}
            {snap.rangePnlPct != null ? (
              <span className="ml-1 text-sm text-zinc-400">{snap.rangePnlPct.toFixed(1)}%</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* History + performers */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 lg:col-span-2">
          <SectionTitle>{t("Hasil (P/L)", "Results (P/L)")}</SectionTitle>
          <TrackHistoryLine
            points={snap.pnlHistory}
            pnlMode
            formatValue={(n) => formatPnl(n, { ...formatOpts, compact: true })}
          />
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
          <SectionTitle>{t("Performers", "Performers")}</SectionTitle>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <span className="text-zinc-400">{t("Terbaik", "Best")}</span>
              <p className="font-medium text-zinc-100">
                {snap.bestPerformer
                  ? `${snap.bestPerformer.symbol} · ${snap.bestPerformer.pct.toFixed(1)}%`
                  : "-"}
              </p>
            </li>
            <li>
              <span className="text-zinc-400">{t("Terburuk", "Worst")}</span>
              <p className="font-medium text-zinc-100">
                {snap.worstPerformer
                  ? `${snap.worstPerformer.symbol} · ${snap.worstPerformer.pct.toFixed(1)}%`
                  : "-"}
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Allocation side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
          <SectionTitle>{t("Alokasi sekarang", "Allocation now")}</SectionTitle>
          <TrackAllocationPie slices={snap.allocationNow} />
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
          <SectionTitle>{t("Alokasi over time", "Allocation over time")}</SectionTitle>
          <TrackAllocationOverTime series={snap.allocationOverTime} symbols={symbols} />
        </div>
      </div>

      {/* Holdings + transactions */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-800/80 lg:col-span-3">
          <div className="border-b border-zinc-800/80 px-3 py-2">
            <SectionTitle>{t("Aset (holdings)", "Assets (holdings)")}</SectionTitle>
          </div>
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="sticky top-0 bg-zinc-950/95">
                <tr className="text-left text-xs text-zinc-500">
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">{t("Harga live", "Live price")}</th>
                  <th className="px-3 py-2 font-medium">{t("Nilai", "Value")}</th>
                  <th className="px-3 py-2 font-medium">P/L</th>
                  <th className="px-3 py-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {snap.holdings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-zinc-500">
                      {t("Belum ada holdings. Tambah transaksi dulu.", "No holdings yet. Add a transaction first.")}
                    </td>
                  </tr>
                ) : (
                  snap.holdings.map((h) => {
                    const normSym = normalizeSymbol(h.symbol);
                    const live = liveQuotes[normSym];
                    const livePrice = live?.price ?? null;
                    return (
                  <tr key={h.symbol} className="border-t border-zinc-800/60">
                    <td className="px-3 py-2 font-medium text-zinc-200">{h.symbol}</td>
                    <td className="px-3 py-2 tabular-nums text-zinc-400">{formatTrackQty(h.quantity)}</td>
                    <td className="px-3 py-2 tabular-nums text-zinc-300">
                      {livePrice != null ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
                      {live ? <span className="ml-1 text-[10px] text-emerald-400">●</span> : null}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{formatPnl(h.marketValue, formatOpts)}</td>
                    <td className={cn("px-3 py-2 tabular-nums", h.unrealizedPnl >= 0 ? "note-pnl-up" : "note-pnl-down")}>
                      {formatPnl(h.unrealizedPnl, formatOpts)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-zinc-400">{h.weight.toFixed(1)}%</td>
                  </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/80 lg:col-span-2">
          <div className="border-b border-zinc-800/80 px-3 py-2">
            <SectionTitle>{t("Transaksi terbaru", "Recent transactions")}</SectionTitle>
          </div>
          <ul className="max-h-[320px] divide-y divide-zinc-800/80 overflow-auto">
            {recentTx.length === 0 ? (
              <li className="px-3 py-4 text-sm text-zinc-400">{t("Belum ada transaksi.", "No transactions yet.")}</li>
            ) : (
              recentTx.map((tx) => (
                <li key={tx.id} className="px-3 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-200">
                      {tx.type.replace("_", " ").toUpperCase()} · {tx.symbol}
                    </span>
                    <span className="shrink-0 tabular-nums text-xs text-zinc-400">
                      {formatTrackDateTime(tx.executedAt, locale)}
                    </span>
                  </div>
                  <p className="mt-0.5 tabular-nums text-xs text-zinc-400">
                    {formatTrackQty(tx.quantity)} @ {tx.unitPrice ?? "-"} {tx.quoteCurrency}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {showCreatePf ? <CreatePortfolioDialog locale={locale} onClose={() => setShowCreatePf(false)} /> : null}
      {showAddTx && txPortfolioId ? (
        <AddTransactionDialog
          locale={locale}
          portfolioId={txPortfolioId}
          quoteCurrency={prefs.currency}
          onClose={() => setShowAddTx(false)}
        />
      ) : null}
    </div>
  );
}

export function NoteTrackView() {
  return (
    <NoteTrackProvider>
      <TrackInner />
    </NoteTrackProvider>
  );
}
