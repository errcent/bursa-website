"use client";

import { useMemo, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { computeDrawdown, calculatePositionSize } from "@/lib/note/drawdown";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { formatPnl } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Drawdown gauge + position sizing calculator (v3 P1).
 * Shown on Analytics page.
 */
export function NoteDrawdownGauge() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const formatOpts = pnlOptsFromPrefs(prefs);
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  const dd = useMemo(() => {
    if (journal.loading || !journal.data) return null;
    return computeDrawdown(journal.data.entries ?? []);
  }, [journal.data, journal.loading]);

  // Position sizing calculator state
  const [accountSize, setAccountSize] = useState("");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [side, setSide] = useState("BUY");

  const sizing = useMemo(() => {
    const a = Number(accountSize);
    const r = Number(riskPct);
    const e = Number(entry);
    const s = Number(sl);
    if (!a || !r || !e || !s) return null;
    return calculatePositionSize({ accountSize: a, riskPct: r, entryPrice: e, stopLoss: s, side });
  }, [accountSize, riskPct, entry, sl, side]);

  if (!dd) return null;

  return (
    <div className="space-y-4">
      {/* Drawdown gauge */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">
          {t("Drawdown", "Drawdown")}
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-zinc-400">{t("Maksimum", "Maximum")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-rose-300">
              {formatPnl(dd.maxDrawdown, formatOpts)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("Sekarang", "Current")}</p>
            <p className={cn("mt-1 text-lg font-semibold tabular-nums", dd.currentDrawdown > 0 ? "text-amber-300" : "text-emerald-300")}>
              {formatPnl(dd.currentDrawdown, formatOpts)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("Peak PnL", "Peak PnL")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-200">
              {formatPnl(dd.peakPnl, formatOpts)}
            </p>
          </div>
        </div>
        {/* Drawdown bar */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                dd.drawdownPct > 20 ? "bg-rose-500" : dd.drawdownPct > 10 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, dd.drawdownPct)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {dd.drawdownPct.toFixed(1)}% {t("dari peak", "from peak")}
          </p>
        </div>
      </div>

      {/* Position sizing calculator */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">
          {t("Kalkulator posisi", "Position sizing")}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          {t("Ukuran lot dari account size + risk % + SL.", "Lot size from account size + risk % + SL.")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label>
            <span className="text-xs text-zinc-400">{t("Account size", "Account size")}</span>
            <input
              type="number"
              className="note-field mt-1 min-h-11 text-zinc-100"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              placeholder="10000"
              aria-label={t("Account size", "Account size")}
            />
          </label>
          <label>
            <span className="text-xs text-zinc-400">{t("Risk %", "Risk %")}</span>
            <input
              type="number"
              step="0.1"
              className="note-field mt-1 min-h-11 text-zinc-100"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              placeholder="1"
              aria-label={t("Risk %", "Risk %")}
            />
          </label>
          <label>
            <span className="text-xs text-zinc-400">{t("Entry", "Entry")}</span>
            <input
              type="number"
              step="any"
              className="note-field mt-1 min-h-11 text-zinc-100"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="1.0850"
              aria-label={t("Entry", "Entry")}
            />
          </label>
          <label>
            <span className="text-xs text-zinc-400">Stop loss</span>
            <input
              type="number"
              step="any"
              className="note-field mt-1 min-h-11 text-zinc-100"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder="1.0820"
              aria-label="Stop loss"
            />
          </label>
        </div>
        {sizing ? (
          <div className="mt-3 space-y-1 rounded-md border border-zinc-700 bg-zinc-900/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">{t("Risk per trade", "Risk per trade")}</span>
              <span className="tabular-nums font-medium text-amber-300">
                {formatPnl(sizing.riskAmount, formatOpts)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{t("Lot size", "Lot size")}</span>
              <span className="tabular-nums font-semibold text-zinc-100">
                {sizing.lotSize.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{t("Nilai posisi", "Position value")}</span>
              <span className="tabular-nums text-zinc-300">
                {formatPnl(sizing.positionValue, formatOpts)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
