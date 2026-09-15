"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { classifyNoteText, tagLabel } from "@/lib/note/cognition/tags";
import { getBeliefLink, loadBeliefLinks, saveBeliefLink } from "@/lib/note/cognition/links";
import { isBeliefEntry } from "@/lib/note/cognition/promotions";
import { loadPlaybook } from "@/lib/note/playbook/storage";
import { dayKey } from "@/lib/note/stats";
import { noteCopy } from "@/lib/note/copy";
import type { JournalEntry } from "@/lib/note/types";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
export function NoteBeliefList({
  entries,
  allEntries,
}: {
  entries: JournalEntry[];
  allEntries: JournalEntry[];
}) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const locale = prefs.locale;
  const [links, setLinks] = useState<Record<string, ReturnType<typeof getBeliefLink>>>({});

  useEffect(() => {
    setLinks(loadBeliefLinks());
  }, [entries.length]);

  const beliefs = useMemo(
    () =>
      [...entries]
        .filter(isBeliefEntry)
        .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt)),
    [entries]
  );

  const recentTrades = useMemo(
    () =>
      allEntries
        .filter((e) => isPnlKind(e.kind))
        .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))
        .slice(0, 12),
    [allEntries]
  );

  const setups = useMemo(() => loadPlaybook().setups.filter((s) => s.enabled), []);

  if (!beliefs.length) {
    return (
      <p className="text-sm text-zinc-500">
        {copy.notesEmpty}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {beliefs.map((entry) => {
        const text = entry.note ?? entry.lesson ?? "";
        const tags = classifyNoteText(text);
        const link = links[entry.id] ?? getBeliefLink(entry.id);
        return (
          <li
            key={entry.id}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-3 sm:px-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <time className="text-[11px] tabular-nums text-zinc-500">{dayKey(entry.openedAt)}</time>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400"
                  >
                    {tagLabel(tag, locale)}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{text}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-3">
              <span className="text-[10px] uppercase tracking-wide text-zinc-600">{copy.notesLinkOptional}</span>
              <select
                className="max-w-[10rem] rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
                value={link?.journalEntryId ?? ""}
                onChange={(e) => {
                  const journalEntryId = e.target.value || undefined;
                  saveBeliefLink(entry.id, { journalEntryId });
                  setLinks({ ...loadBeliefLinks(), [entry.id]: getBeliefLink(entry.id) });
                }}
                aria-label={copy.notesLinkJournal}
              >
                <option value="">{copy.notesLinkJournalNone}</option>
                {recentTrades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.symbol} · {dayKey(t.openedAt)}
                  </option>
                ))}
              </select>
              <select
                className="max-w-[10rem] rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
                value={link?.playbookSetupId ?? ""}
                onChange={(e) => {
                  const playbookSetupId = e.target.value || undefined;
                  saveBeliefLink(entry.id, { playbookSetupId });
                  setLinks({ ...loadBeliefLinks() });
                }}
                aria-label={copy.notesLinkPlaybook}
              >
                <option value="">{copy.notesLinkPlaybookNone}</option>
                {setups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {(link?.journalEntryId || link?.playbookSetupId) && (
                <Link href="/note/playbook" className="text-[11px] text-zinc-500 hover:text-zinc-300">
                  {copy.notesLinkPlaybookOpen}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
