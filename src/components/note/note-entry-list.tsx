"use client";

import { useMemo, useState, type ReactNode } from "react";

import { dayKey, formatPnl, pnlTone, resolvedResult, type ColorMode, type FormatPnlOpts } from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";

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
  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const key = dayKey(entry.openedAt);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, rows]) => [date, [...rows].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))] as [
        string,
        JournalEntry[],
      ]);
  }, [entries]);

  if (entries.length === 0) {
    return empty ?? <p className="text-sm text-zinc-500">Belum ada entry.</p>;
  }

  return (
    <div className="space-y-5">
      {grouped.map(([date, rows]) => (
        <section key={date}>
          {hideDates ? null : (
            <h2 className="mb-1 text-[11px] tabular-nums text-zinc-500">{date}</h2>
          )}
          <ul>
            {rows.map((entry) => {
              const open = openId === entry.id;
              const result = resolvedResult(entry);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : entry.id)}
                    className="flex w-full items-baseline justify-between gap-4 rounded-md px-1 py-2 text-left hover:bg-zinc-900"
                  >
                    <span className="min-w-0 truncate text-sm text-zinc-200">
                      {entry.symbol}
                      <span className="ml-2 text-zinc-500">{entry.side}</span>
                    </span>
                    <span className={`shrink-0 text-sm tabular-nums ${pnlTone(entry.pnl ?? 0, colorMode)}`}>
                      {formatPnl(entry.pnl, formatOpts)}
                    </span>
                  </button>
                  {open && (entry.note || entry.emotion || result) ? (
                    <p className="px-1 pb-3 text-xs text-zinc-500">
                      {[entry.emotion, result, entry.note].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
