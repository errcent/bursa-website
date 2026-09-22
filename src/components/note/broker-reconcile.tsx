"use client";

import { useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Broker reconcile (v3 P0).
 *
 * Paste broker P&L → compare with journal → flag mismatch.
 * Closes "Data berbohong" rejection reason.
 */
export function BrokerReconcile() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [brokerPnl, setBrokerPnl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  function reconcile() {
    const brokerNum = Number(brokerPnl.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(brokerNum)) {
      setResult(t("Masukkan angka P&L dari broker.", "Enter broker P&L number."));
      return;
    }

    const entries = (journal.data?.entries ?? []).filter((e) => isPnlKind(e.kind));
    const summary = summarizeJournal(entries);
    const journalPnl = summary.pnlSum ?? 0;
    const diff = journalPnl - brokerNum;

    if (Math.abs(diff) < 1) {
      setResult(
        t(
          `Cocok. Jurnal: ${journalPnl.toLocaleString()}. Broker: ${brokerNum.toLocaleString()}. Tidak ada gap.`,
          `Match. Journal: ${journalPnl.toLocaleString()}. Broker: ${brokerNum.toLocaleString()}. No gap.`
        )
      );
      return;
    }

    const likelyCause =
      Math.abs(diff) > 50
        ? t(
            "Kemungkinan: fee/funding/commission tidak masuk jurnal.",
            "Likely: fees/funding/commission not logged."
          )
        : t("Kemungkinan: rounding atau kurs.", "Likely: rounding or FX rate.");

    setResult(
      t(
        `Gap: ${diff > 0 ? "+" : ""}${diff.toLocaleString()}. Jurnal: ${journalPnl.toLocaleString()}, Broker: ${brokerNum.toLocaleString()}. ${likelyCause}`,
        `Gap: ${diff > 0 ? "+" : ""}${diff.toLocaleString()}. Journal: ${journalPnl.toLocaleString()}, Broker: ${brokerNum.toLocaleString()}. ${likelyCause}`
      )
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">
          {t("Reconcile broker", "Broker reconcile")}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          {t(
            "Tempel P&L dari app broker, bandingkan dengan jurnal. Deteksi gap fee/kurs/trade hilang.",
            "Paste broker app P&L, compare with journal. Detect fee/FX/missing-trade gaps."
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="note-field min-h-11 flex-1 text-zinc-100"
          value={brokerPnl}
          onChange={(e) => setBrokerPnl(e.target.value)}
          placeholder={t("Contoh: 220000 atau -50000", "Example: 220000 or -50000")}
          aria-label={t("P&L broker", "Broker P&L")}
        />
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white"
          onClick={reconcile}
        >
          {t("Cek", "Check")}
        </button>
      </div>
      {result ? (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            result.startsWith(t("Cocok", "Match"))
              ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
              : "border-amber-800/60 bg-amber-950/30 text-amber-200"
          )}
        >
          {result}
        </p>
      ) : null}
    </div>
  );
}
