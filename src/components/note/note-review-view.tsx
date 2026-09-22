"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { BrokerReconcile } from "@/components/note/broker-reconcile";
import { MentorShareButton } from "@/components/note/mentor-share-button";
import { dayKey, filterEntries, formatPnl, summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

function periodEntries(
  entries: ReturnType<typeof filterEntries>,
  daysBack: number,
  now = new Date()
) {
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  const min = dayKey(start.toISOString());
  return entries.filter((e) => isPnlKind(e.kind) && dayKey(e.openedAt) >= min);
}

export function NoteReviewView() {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const formatOpts = pnlOptsFromPrefs(prefs);
  const kind = NOTE_EXECUTION_KIND;
  const journal = useNoteJournal();

  const kindScoped = useMemo(
    () => filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" }),
    [journal.data, kind]
  );
  const weekRows = useMemo(() => periodEntries(kindScoped, 7), [kindScoped]);
  const monthRows = useMemo(() => periodEntries(kindScoped, 31), [kindScoped]);
  const week = useMemo(() => summarizeJournal(weekRows), [weekRows]);
  const month = useMemo(() => summarizeJournal(monthRows), [monthRows]);

  const mistake =
    month.losses > month.wins && month.closedCount >= 3
      ? prefs.locale === "en"
        ? "Losses outnumber wins this month - list top 3 rule breaks."
        : "Loss lebih banyak dari win bulan ini - tulis 3 aturan yang dilanggar."
      : prefs.locale === "en"
        ? "No dominant mistake pattern - keep weekly notes short."
        : "Belum ada pola mistake dominan - cukup catatan mingguan singkat.";

  if (journal.loading || !journal.data) {
    return <p className="text-sm text-zinc-400">{copy.loading}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800/80 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            {prefs.locale === "en" ? "Last 7 days" : "7 hari"}
          </p>
          <p className="mt-2 font-heading text-xl tabular-nums text-zinc-100">
            {formatPnl(week.pnlSum, formatOpts)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {week.closedCount} close · {week.winRate == null ? "-" : `${Math.round(week.winRate * 100)}% win`}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            {prefs.locale === "en" ? "Last 31 days" : "31 hari"}
          </p>
          <p className="mt-2 font-heading text-xl tabular-nums text-zinc-100">
            {formatPnl(month.pnlSum, formatOpts)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {month.closedCount} close · {month.winRate == null ? "-" : `${Math.round(month.winRate * 100)}% win`}
          </p>
        </div>
      </div>
      <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-sm text-zinc-300">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {prefs.locale === "en" ? "Mistake summary" : "Ringkasan mistake"}
        </p>
        {mistake}
      </div>

      <BrokerReconcile />

      <MentorShareButton />
    </div>
  );
}
