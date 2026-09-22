"use client";

import { useMemo, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import {
  MATRIX_DIMS,
  buildCrossMatrix,
  type MatrixDim,
} from "@/lib/note/cross-matrix";
import { pnlOptsForSlot } from "@/lib/note/prefs";
import { filterEntries, formatPnl } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/**
 * Cross-matrix explorer: pick row + column dimensions,
 * see where net P&L actually comes from. Sorted by net desc.
 */
export function NoteCrossMatrix() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const formatOpts = pnlOptsForSlot(prefs, "analytics");
  const [rowDim, setRowDim] = useState<MatrixDim>("symbol");
  const [colDim, setColDim] = useState<MatrixDim | "">("");

  const cells = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], {
      kind: NOTE_EXECUTION_KIND,
      result: "ALL",
    }).filter((e) => isPnlKind(e.kind));
    return buildCrossMatrix(scoped, rowDim, colDim || undefined).slice(0, 30);
  }, [journal.data, rowDim, colDim]);

  if (journal.loading || !journal.data) return null;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Baris", "Rows")}</span>
          <select
            className="note-field mt-1 block min-h-11 min-w-[10rem] text-sm"
            value={rowDim}
            onChange={(e) => setRowDim(e.target.value as MatrixDim)}
            aria-label={t("Dimensi baris", "Row dimension")}
          >
            {MATRIX_DIMS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label[prefs.locale]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Kolom (opsional)", "Columns (optional)")}</span>
          <select
            className="note-field mt-1 block min-h-11 min-w-[10rem] text-sm"
            value={colDim}
            onChange={(e) => setColDim(e.target.value as MatrixDim | "")}
            aria-label={t("Dimensi kolom", "Column dimension")}
          >
            <option value="">-</option>
            {MATRIX_DIMS.filter((d) => d.id !== rowDim).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label[prefs.locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cells.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">
          {t("Belum ada close untuk dianalisis.", "No closes to analyze yet.")}
        </p>
      ) : (
        <div className="mt-3 max-h-[320px] overflow-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="sticky top-0 bg-zinc-950/95">
              <tr className="text-left text-xs text-zinc-500">
                <th className="px-3 py-2 font-medium">{t("Baris", "Row")}</th>
                {colDim ? <th className="px-3 py-2 font-medium">{t("Kolom", "Column")}</th> : null}
                <th className="px-3 py-2 text-right font-medium">{t("Dag", "Trades")}</th>
                <th className="px-3 py-2 text-right font-medium">Net</th>
                <th className="px-3 py-2 text-right font-medium">Win</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((c) => (
                <tr key={`${c.row}|${c.col}`} className="border-t border-zinc-800/60">
                  <td className="px-3 py-2 font-medium text-zinc-200">{c.row}</td>
                  {colDim ? <td className="px-3 py-2 text-zinc-400">{c.col}</td> : null}
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{c.trades}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular-nums",
                      c.net >= 0 ? "note-pnl-up" : "note-pnl-down",
                    )}
                  >
                    {formatPnl(c.net, formatOpts)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                    {c.winRate == null ? "-" : `${Math.round(c.winRate * 100)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
