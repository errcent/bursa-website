"use client";

import { useMemo, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { dayKey, summarizeJournal, formatPnl } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";

/**
 * Tax report export (v3 P2).
 * Exports annual P&L summary as CSV for tax purposes.
 */
export function NoteTaxExport() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [year, setYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const formatOpts = pnlOptsFromPrefs(prefs);
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  const yearData = useMemo(() => {
    if (journal.loading || !journal.data) return { entries: [], summary: null };
    const entries = (journal.data.entries ?? [])
      .filter((e) => isPnlKind(e.kind))
      .filter((e) => {
        const y = new Date(e.openedAt).getFullYear();
        return y === year;
      });
    const summary = summarizeJournal(entries);
    return { entries, summary };
  }, [journal.data, journal.loading, year]);

  function exportCsv() {
    setExporting(true);
    const rows = [
      ["Date", "Symbol", "Side", "Qty", "Entry", "Exit", "PnL", "Fees", "Result"],
      ...yearData.entries.map((e) => [
        dayKey(e.openedAt),
        e.symbol,
        e.side,
        e.qty ?? "",
        e.entryPrice ?? "",
        e.exitPrice ?? "",
        e.pnl ?? "",
        e.fees ?? "",
        e.result ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bursa-note-tax-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (journal.loading || !journal.data) return null;
  const hasData = yearData.entries.length > 0;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">
          {t("Laporan pajak", "Tax report")}
        </h3>
        <select
          className="note-field min-h-11 w-24 text-sm text-zinc-100"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="Year"
        >
          {[2026, 2025, 2024].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {hasData && yearData.summary ? (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-zinc-400">{t("Total PnL", "Total PnL")}</p>
              <p className={yearData.summary.pnlSum >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {formatPnl(yearData.summary.pnlSum ?? 0, formatOpts)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">{t("Trade", "Trades")}</p>
              <p className="text-zinc-200">{yearData.summary.closedCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">{t("Win rate", "Win rate")}</p>
              <p className="text-zinc-200">
                {yearData.summary.winRate == null ? "-" : `${Math.round(yearData.summary.winRate * 100)}%`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white"
            onClick={exportCsv}
            disabled={exporting}
          >
            {exporting ? t("Mengekspor...", "Exporting...") : t("Ekspor CSV", "Export CSV")}
          </button>
        </>
      ) : (
        <p className="text-xs text-zinc-400">
          {t(`Tidak ada trade di ${year}.`, `No trades in ${year}.`)}
        </p>
      )}
    </div>
  );
}
