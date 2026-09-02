"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { NoteBreakdown } from "@/components/note/note-breakdown";
import { NoteCalendar } from "@/components/note/note-calendar";
import { NoteEntryList } from "@/components/note/note-entry-list";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNoteKind } from "@/components/note/note-kind-context";
import { NoteStatsStrip } from "@/components/note/note-stats-strip";
import { noteCopy } from "@/lib/note/copy";
import { noteApexLoginHref } from "@/lib/note/sso-urls";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import {
  cumulativePnl,
  dayKey,
  filterEntries,
  formatNoteTimestamp,
  formatPnl,
  groupByEmotion,
  groupBySymbol,
  latestActivityIso,
  monthBuckets,
  summarizeJournal,
} from "@/lib/note/stats";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteHome() {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const formatOpts = pnlOptsFromPrefs(prefs);
  const cellOpts = { ...formatOpts, compact: true, naked: true, decimals: 0 as const };
  const { kind } = useNoteKind();
  const journal = useNoteJournal();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const today = dayKey(now.toISOString());

  useEffect(() => {
    setSelectedDate(null);
  }, [kind]);

  const kindScoped = useMemo(
    () => filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" }),
    [journal.data, kind]
  );
  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-`;
  const heroEntries = useMemo(() => {
    if (prefs.heroRange !== "month") return kindScoped;
    return kindScoped.filter((entry) => dayKey(entry.openedAt).startsWith(monthPrefix));
  }, [kindScoped, prefs.heroRange, monthPrefix]);
  const dayEntries = useMemo(
    () => (selectedDate ? filterEntries(kindScoped, { kind: "ALL", result: "ALL", date: selectedDate }) : null),
    [kindScoped, selectedDate]
  );
  const logEntries = dayEntries ?? kindScoped;
  const snapshot = useMemo(() => summarizeJournal(heroEntries), [heroEntries]);
  const equity = useMemo(() => cumulativePnl(heroEntries), [heroEntries]);
  const buckets = useMemo(
    () => monthBuckets(kindScoped, cursor.year, cursor.month),
    [kindScoped, cursor]
  );
  const symbols = useMemo(() => groupBySymbol(heroEntries), [heroEntries]);
  const emotions = useMemo(() => groupByEmotion(heroEntries), [heroEntries]);
  const updatedIso = useMemo(() => latestActivityIso(kindScoped), [kindScoped]);
  const updated = updatedIso ? formatNoteTimestamp(updatedIso) : null;
  const daySnap = dayEntries ? summarizeJournal(dayEntries) : null;
  const baruHref = selectedDate ? `/note/baru?date=${selectedDate}` : "/note/baru";
  const recentEntries = useMemo(() => {
    if (selectedDate) return logEntries;
    return [...logEntries]
      .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))
      .slice(0, 12);
  }, [logEntries, selectedDate]);

  if (journal.error) {
    return <p className="text-sm text-rose-400">{journal.error}</p>;
  }
  if (journal.loading || !journal.data) {
    return <p className="text-sm text-zinc-600">{prefs.locale === "en" ? "Loading…" : "Memuat jurnal…"}</p>;
  }

  const space = prefs.density === "compact" ? "space-y-6" : "space-y-8";

  return (
    <div className={space}>
      {journal.demo ? (
        <p className="text-xs text-zinc-500">
          {copy.contoh}{" "}
          <Link href={noteApexLoginHref("/note")} className="text-zinc-200 hover:underline">
            {copy.masuk}
          </Link>
        </p>
      ) : null}

      <NoteStatsStrip
        snapshot={snapshot}
        equity={equity}
        updatedLabel={updated ? `${updated.relative} · ${updated.absolute}` : null}
        colorMode={prefs.colorMode}
        formatOpts={formatOpts}
        labels={{
          net: copy.net,
          win: copy.win,
          entry: copy.entry,
          kurva: copy.kurva,
          expectansi: copy.expectansi,
          diperbarui: copy.diperbarui,
        }}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)] lg:items-start">
        <NoteCalendar
          year={cursor.year}
          monthIndex={cursor.month}
          buckets={buckets}
          selectedDate={selectedDate}
          today={today}
          weekStart={prefs.weekStart}
          showNet={prefs.calendarShowNet}
          density={prefs.density}
          colorMode={prefs.colorMode}
          formatOpts={cellOpts}
          onSelect={(date) => setSelectedDate((current) => (current === date ? null : date))}
          onPrev={() =>
            setCursor((c) =>
              c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
            )
          }
          onNext={() =>
            setCursor((c) =>
              c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
            )
          }
        />

        <div className={space}>
          {selectedDate && daySnap ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span>
                {copy.hariItu}:{" "}
                <span className="tabular-nums text-zinc-200">
                  {formatPnl(daySnap.pnlSum, formatOpts)} · {daySnap.tradeCount}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200 hover:bg-zinc-900 hover:text-white"
              >
                {copy.lepas}
              </button>
              <Link
                href={baruHref}
                className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-950 hover:bg-white"
              >
                {copy.baru}
              </Link>
            </div>
          ) : null}

          <div>
            <h2 className="mb-3 text-[11px] text-zinc-500">
              {selectedDate
                ? `${copy.log} · ${selectedDate}`
                : logEntries.length > recentEntries.length
                  ? `${copy.terbaru} · ${recentEntries.length}`
                  : copy.terbaru}
            </h2>
            <NoteEntryList
              entries={recentEntries}
              colorMode={prefs.colorMode}
              formatOpts={formatOpts}
              hideDates={Boolean(selectedDate)}
              empty={
                <p className="text-sm text-zinc-500">
                  {selectedDate ? copy.belumAdaHari : copy.belumAda}{" "}
                  <Link href={baruHref} className="text-zinc-200 hover:underline">
                    {copy.tulisSatu}
                  </Link>
                </p>
              }
            />
          </div>
        </div>
      </div>

      {selectedDate ? null : (
        <NoteBreakdown
          symbols={symbols}
          emotions={emotions}
          colorMode={prefs.colorMode}
          formatOpts={formatOpts}
          scopeLabel={copy.scopeFilter}
        />
      )}
    </div>
  );
}
