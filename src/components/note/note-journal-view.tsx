"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { NoteEntryList } from "@/components/note/note-entry-list";
import { NoteJournalFilters } from "@/components/note/note-journal-filters";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { fxContextFromPrefs } from "@/lib/note/fx/context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { noteCopy } from "@/lib/note/copy";
import { noteApexLoginHref } from "@/lib/note/sso-urls";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import {
  filterEntries,
  formatNoteTimestamp,
  formatPnl,
  latestActivityIso,
  summarizeJournal,
  type JournalFilterOpts,
} from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteJournalView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [prefs] = useNotePrefs();
  const fx = useMemo(() => fxContextFromPrefs(prefs), [prefs]);
  const copy = noteCopy(prefs.locale);
  const formatOpts = pnlOptsFromPrefs(prefs);
  const kind = NOTE_EXECUTION_KIND;
  const journal = useNoteJournal();

  const [filters, setFilters] = useState<JournalFilterOpts>(() => ({
    kind,
    result: "ALL",
    date: dateParam,
    dateFrom: dateParam,
    dateTo: dateParam,
    symbol: null,
    side: null,
  }));

  useEffect(() => {
    if (dateParam) {
      setFilters((f) => ({
        ...f,
        date: dateParam,
        dateFrom: dateParam,
        dateTo: dateParam,
      }));
    }
  }, [dateParam]);

  const kindScoped = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" });
    return scoped.filter((e) => isPnlKind(e.kind));
  }, [journal.data, kind]);

  const symbolOptions = useMemo(
    () => [...new Set(kindScoped.map((e) => e.symbol.trim()).filter(Boolean))].sort(),
    [kindScoped]
  );

  const filtered = useMemo(
    () => filterEntries(kindScoped, { ...filters, kind: "ALL" }),
    [kindScoped, filters]
  );

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt)),
    [filtered]
  );

  const updatedIso = useMemo(() => latestActivityIso(kindScoped), [kindScoped]);
  const updated = updatedIso ? formatNoteTimestamp(updatedIso, new Date().toISOString(), prefs.locale) : null;
  const snap = useMemo(() => summarizeJournal(filtered, fx), [filtered, fx]);

  const singleDay = filters.dateFrom && filters.dateFrom === filters.dateTo ? filters.dateFrom : null;
  const baruHref = singleDay ? `/note/baru?date=${singleDay}` : "/note/baru";

  if (journal.error) {
    return <p className="note-pnl-down text-sm">{journal.error}</p>;
  }
  if (journal.loading || !journal.data) {
    return <p className="text-sm text-zinc-400">{copy.loadingJournal}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {journal.demo && !journal.openAccess ? (
        <p className="text-xs text-zinc-400">
          {copy.contoh}{" "}
          <Link href={noteApexLoginHref("/note/jurnal")} className="text-zinc-200 hover:underline">
            {copy.masuk}
          </Link>
        </p>
      ) : null}

      <Link
        href={baruHref}
        className="flex min-h-11 w-full max-w-md items-center justify-center rounded-md bg-zinc-100 px-4 text-center text-sm font-semibold text-zinc-950 hover:bg-white"
      >
        + {copy.logTrade}
      </Link>

      <NoteJournalFilters
        locale={prefs.locale}
        value={filters}
        symbols={symbolOptions}
        onChange={(next) => {
          setFilters(next);
          if (next.dateFrom && next.dateFrom === next.dateTo) {
            router.replace(`/note/jurnal?date=${next.dateFrom}`);
          } else if (!next.dateFrom && !next.dateTo && dateParam) {
            router.replace("/note/jurnal");
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <span className="tabular-nums">
          {formatPnl(snap.pnlSum, formatOpts)} · {snap.tradeCount} {copy.journalRows}
          {snap.winRate != null ? ` · ${Math.round(snap.winRate * 100)}% W` : ""}
        </span>
        <Link
          href="/note/impor"
          className="inline-flex min-h-11 items-center px-1 text-zinc-300 hover:text-zinc-100"
        >
          {copy.impor}
        </Link>
        <Link
          href="/note/track"
          className="inline-flex min-h-11 items-center px-1 text-zinc-300 hover:text-zinc-100"
        >
          Track
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">
            {singleDay ? `${copy.log} · ${singleDay}` : copy.journal}
          </h2>
          {updated ? (
            <span className="text-xs text-zinc-400">
              {copy.diperbarui} {updated.relative}
            </span>
          ) : null}
        </div>
        <NoteEntryList
          entries={sorted}
          locale={prefs.locale}
          colorMode={prefs.colorMode}
          formatOpts={formatOpts}
          hideDates={Boolean(singleDay)}
          empty={
            <p className="text-sm text-zinc-400">
              {copy.belumAda}{" "}
              <Link href={baruHref} className="text-zinc-200 hover:underline">
                {copy.tulisSatu}
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
