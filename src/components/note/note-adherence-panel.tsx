"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { summarizeAdherence } from "@/lib/note/playbook/adherence";
import { pnlOptsForSlot } from "@/lib/note/prefs";
import { filterEntries, formatPnl } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/**
 * Followed-vs-broken panel: does following the playbook actually pay?
 * Reads per-trade snapshots stored in `protocol` at entry time.
 */
export function NoteAdherencePanel() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const formatOpts = pnlOptsForSlot(prefs, "analytics");

  const summary = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], {
      kind: NOTE_EXECUTION_KIND,
      result: "ALL",
    }).filter((e) => isPnlKind(e.kind));
    return summarizeAdherence(scoped);
  }, [journal.data]);

  if (journal.loading || !journal.data) return null;
  const scored = summary.followed.trades + summary.broken.trades;
  if (scored === 0) return null;

  const rows = [
    {
      label: t("Ikut playbook", "Followed playbook"),
      bucket: summary.followed,
      tone: "up" as const,
    },
    {
      label: t("Langgar aturan", "Broke rules"),
      bucket: summary.broken,
      tone: "down" as const,
    },
  ];

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {t("Kepatuhan vs hasil", "Adherence vs outcome")}
        </p>
        {summary.adherenceRate != null ? (
          <p className="text-xs tabular-nums text-zinc-300">
            {Math.round(summary.adherenceRate * 100)}% {t("patuh", "adherent")}
          </p>
        ) : null}
      </div>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-2">
            <span className="text-sm text-zinc-300">{row.label}</span>
            <span className="text-xs tabular-nums text-zinc-400">
              {row.bucket.trades} {t("dag", "trades")}
            </span>
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                row.bucket.net >= 0 ? "note-pnl-up" : "note-pnl-down",
              )}
            >
              {formatPnl(row.bucket.net, formatOpts)}
            </span>
            <span className="w-12 text-right text-xs tabular-nums text-zinc-400">
              {row.bucket.winRate == null ? "-" : `${Math.round(row.bucket.winRate * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
      {summary.unscored > 0 ? (
        <p className="mt-2 text-xs text-zinc-400">
          {summary.unscored} {t("trade tanpa snapshot checklist.", "trades without a checklist snapshot.")}
        </p>
      ) : null}
    </div>
  );
}
