"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";

import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { courseClassHref } from "@/lib/security/safe-http-url";
import { journalKindLabel, journalModeLabel, noteCopy } from "@/lib/note/copy";
import type { NoteLocale } from "@/lib/note/prefs";
import {
  dayKey,
  formatNoteTimestamp,
  formatPnl,
  pnlTone,
  type ColorMode,
  type FormatPnlOpts,
} from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";

export function NoteEntryList({
  entries,
  locale,
  colorMode,
  formatOpts,
  hideDates = false,
  empty,
}: {
  entries: JournalEntry[];
  locale: NoteLocale;
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
  hideDates?: boolean;
  empty?: ReactNode;
}) {
  const copy = noteCopy(locale);
  const [openId, setOpenId] = useState<string | null>(null);
  const catalogBase = isProductionHostRouting() ? originFor("apex") : "";

  const sorted = useMemo(
    () => [...entries].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt)),
    [entries]
  );

  if (entries.length === 0) {
    return empty ?? <p className="text-sm text-zinc-400">{copy.belumAda}</p>;
  }

  return (
    <div className="note-journal-table overflow-x-auto rounded-lg border border-zinc-800/80">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80 text-xs uppercase tracking-wide text-zinc-400">
            {hideDates ? null : <th className="px-4 py-3 font-medium">{copy.colDate}</th>}
            <th className="px-4 py-3 font-medium">{copy.colSymbol}</th>
            <th className="px-4 py-3 font-medium">{copy.jenis}</th>
            <th className="px-4 py-3 font-medium">{copy.colSide}</th>
            <th className="px-4 py-3 font-medium text-right">PnL</th>
            <th className="px-4 py-3 font-medium">{copy.colMode}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const open = openId === entry.id;
            const ts = formatNoteTimestamp(entry.openedAt, new Date().toISOString(), locale);
            const isRefleksi = entry.kind === "REFLEKSI";
            const courseHref = entry.relatedCourseSlug
              ? courseClassHref(catalogBase, entry.relatedCourseSlug)
              : null;
            return (
              <Fragment key={entry.id}>
                <tr
                  className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/60"
                  onClick={() => setOpenId(open ? null : entry.id)}
                >
                  {hideDates ? null : (
                    <td className="px-4 py-3 tabular-nums text-zinc-400">{dayKey(entry.openedAt)}</td>
                  )}
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    {entry.symbol}
                    {courseHref ? (
                      <a
                        href={courseHref}
                        className="ml-2 text-xs font-normal text-zinc-400 hover:text-zinc-200"
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.classShort}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{journalKindLabel(entry.kind, locale)}</td>
                  <td className="px-4 py-3 text-zinc-400">{entry.side}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${isRefleksi ? "text-zinc-400" : pnlTone(entry.pnl ?? 0, colorMode)}`}
                  >
                    {isRefleksi ? "-" : formatPnl(entry.pnl, formatOpts)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{journalModeLabel(entry.mode, locale)}</td>
                </tr>
                {open ? (
                  <tr className="bg-zinc-900/40">
                    <td colSpan={hideDates ? 5 : 6} className="px-4 py-3 text-xs leading-relaxed text-zinc-400">
                      <span className="text-zinc-400">{ts.absolute}</span>
                      {entry.note ? <p className="mt-1 text-zinc-300">{entry.note}</p> : null}
                      {entry.ruleBroken ? (
                        <p className="mt-1">
                          {copy.ruleShort}: {entry.ruleBroken}
                        </p>
                      ) : null}
                      {entry.lesson ? (
                        <p className="mt-1">
                          {copy.lessonShort}: {entry.lesson}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
