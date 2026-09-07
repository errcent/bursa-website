"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";

import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import {
  dayKey,
  formatNoteTimestamp,
  formatPnl,
  pnlTone,
  type ColorMode,
  type FormatPnlOpts,
} from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";

function kindLabel(kind: JournalEntry["kind"]) {
  if (kind === "REFLEKSI") return "Refleksi";
  return kind;
}

export function NoteEntryList({
  entries,
  colorMode,
  formatOpts,
  hideDates = false,
  empty,
}: {
  entries: JournalEntry[];
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
  hideDates?: boolean;
  empty?: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const catalogBase = isProductionHostRouting() ? originFor("apex") : "";

  const sorted = useMemo(
    () => [...entries].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt)),
    [entries]
  );

  if (entries.length === 0) {
    return empty ?? <p className="text-sm text-zinc-500">Belum ada entry.</p>;
  }

  return (
    <div className="note-journal-table overflow-x-auto rounded-lg border border-zinc-800/80">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80 text-[11px] uppercase tracking-wide text-zinc-500">
            {hideDates ? null : <th className="px-3 py-2.5 font-medium">Tanggal</th>}
            <th className="px-3 py-2.5 font-medium">Simbol</th>
            <th className="px-3 py-2.5 font-medium">Jenis</th>
            <th className="px-3 py-2.5 font-medium">Sisi</th>
            <th className="px-3 py-2.5 font-medium text-right">PnL</th>
            <th className="px-3 py-2.5 font-medium">Emosi</th>
            <th className="px-3 py-2.5 font-medium">Mode</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const open = openId === entry.id;
            const ts = formatNoteTimestamp(entry.openedAt);
            const isRefleksi = entry.kind === "REFLEKSI";
            return (
              <Fragment key={entry.id}>
                <tr
                  className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/60"
                  onClick={() => setOpenId(open ? null : entry.id)}
                >
                  {hideDates ? null : (
                    <td className="px-3 py-2.5 tabular-nums text-zinc-400">{dayKey(entry.openedAt)}</td>
                  )}
                  <td className="px-3 py-2.5 font-medium text-zinc-200">
                    {entry.symbol}
                    {entry.relatedCourseSlug ? (
                      <a
                        href={`${catalogBase}/kelas/${entry.relatedCourseSlug}`}
                        className="ml-2 text-[11px] font-normal text-zinc-500 hover:text-zinc-300"
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noreferrer"
                      >
                        kelas
                      </a>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400">{kindLabel(entry.kind)}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{entry.side}</td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums ${isRefleksi ? "text-zinc-600" : pnlTone(entry.pnl ?? 0, colorMode)}`}
                  >
                    {isRefleksi ? "-" : formatPnl(entry.pnl, formatOpts)}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400">{entry.emotion ?? "-"}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{entry.mode}</td>
                </tr>
                {open ? (
                  <tr className="bg-zinc-900/40">
                    <td colSpan={hideDates ? 6 : 7} className="px-3 py-3 text-xs leading-relaxed text-zinc-400">
                      <span className="text-zinc-500">{ts.absolute}</span>
                      {entry.note ? <p className="mt-1 text-zinc-300">{entry.note}</p> : null}
                      {entry.ruleBroken ? <p className="mt-1">Aturan: {entry.ruleBroken}</p> : null}
                      {entry.lesson ? <p className="mt-1">Pelajaran: {entry.lesson}</p> : null}
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
