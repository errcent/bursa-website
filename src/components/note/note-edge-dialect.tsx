"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { BURSA_EDGE_MIN_TRADES, computeEdgeDialect } from "@/lib/note/edge-dialect";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { filterEntries } from "@/lib/note/stats";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Bursa Edge Dialect panel — open 0-100 composite, ID-calibrated.
 * Withheld under 10 closed trades (components still computed).
 */
export function NoteEdgeDialect() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  const dialect = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], {
      kind: NOTE_EXECUTION_KIND,
      result: "ALL",
    }).filter((e) => isPnlKind(e.kind));
    return computeEdgeDialect(scoped);
  }, [journal.data]);

  if (journal.loading || !journal.data) return null;

  const rows = [
    { key: "winRate", label: t("Win rate (penuh 55%)", "Win rate (full 55%)"), value: dialect.components.winRate },
    { key: "profitFactor", label: t("Profit factor (penuh 2,5)", "Profit factor (full 2.5)"), value: dialect.components.profitFactor },
    { key: "expectancyR", label: t("Ekspektasi R (penuh +1R)", "R expectancy (full +1R)"), value: dialect.components.expectancyR },
    { key: "feeDrag", label: t("Beban fee (penuh ≤2%)", "Fee drag (full ≤2%)"), value: dialect.components.feeDrag },
    { key: "drawdown", label: t("Drawdown vs laba kotor", "Drawdown vs gross profit"), value: dialect.components.drawdown },
    { key: "consistency", label: t("Konsistensi harian (≤20%)", "Daily consistency (≤20%)"), value: dialect.components.consistency },
  ];

  const tone =
    dialect.score == null
      ? "text-zinc-400"
      : dialect.score >= 70
        ? "text-emerald-300"
        : dialect.score >= 50
          ? "text-amber-300"
          : "text-rose-300";

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">
          {t("Dialek Edge Bursa", "Bursa Edge Dialect")}
        </h3>
        <p className={cn("font-heading text-2xl font-bold tabular-nums", tone)}>
          {dialect.score == null ? "-" : dialect.score}
          <span className="ml-1 text-xs font-normal text-zinc-500">/100</span>
        </p>
      </div>
      <p className="mt-0.5 text-xs text-zinc-400">
        {dialect.closedTrades} {t("close", "closes")}
        {dialect.score == null
          ? ` · ${t(`butuh ${BURSA_EDGE_MIN_TRADES} untuk skor`, `needs ${BURSA_EDGE_MIN_TRADES} for a score`)}`
          : ""}
        {" · v1"}
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-zinc-400">{r.label}</span>
              <span className="text-xs tabular-nums text-zinc-200">{Math.round(r.value)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full",
                  r.value >= 70 ? "bg-emerald-500" : r.value >= 40 ? "bg-amber-500" : "bg-rose-500",
                )}
                style={{ width: `${Math.round(r.value)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
