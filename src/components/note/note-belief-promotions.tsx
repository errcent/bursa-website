"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { buildBeliefPromotions } from "@/lib/note/cognition/promotions";
import { dismissPromotion, loadDismissedPromotions } from "@/lib/note/cognition/promotion-dismiss";
import { adoptBeliefSnippetToPlaybook } from "@/lib/note/playbook/adopt-belief";
import { loadPlaybook, savePlaybook } from "@/lib/note/playbook/storage";
import { noteCopy } from "@/lib/note/copy";
import type { JournalEntry } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

export function NoteBeliefPromotions({ entries }: { entries: JournalEntry[] }) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const locale = prefs.locale;
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissedPromotions());
  const [adoptedId, setAdoptedId] = useState<string | null>(null);

  const items = useMemo(
    () => buildBeliefPromotions(entries, locale).filter((p) => !dismissed.has(p.id)),
    [entries, locale, dismissed]
  );

  const onDismiss = useCallback((id: string) => {
    dismissPromotion(id);
    setDismissed((prev) => new Set([...prev, id]));
  }, []);

  const onAdopt = useCallback(
    (id: string, snippet: string) => {
      const next = adoptBeliefSnippetToPlaybook(loadPlaybook(), snippet, locale);
      savePlaybook(next);
      setAdoptedId(id);
    },
    [locale]
  );

  if (!items.length) return null;

  return (
    <section className="rounded-lg border border-zinc-800/70 bg-zinc-950/20 px-3 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{copy.notesMirrorTitle}</h2>
      <p className="mt-0.5 text-xs text-zinc-400">{copy.notesMirrorHint}</p>
      <ul className="mt-3 space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              p.kind === "risk_warning" ? "note-surface-down border" : "border-zinc-800/80"
            )}
          >
            <p className="font-medium text-zinc-200">{p.title[locale]}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{p.detail[locale]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.kind === "playbook_candidate" && p.beliefSnippet ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-2.5 text-xs font-semibold text-zinc-900 hover:bg-white"
                  onClick={() => onAdopt(p.id, p.beliefSnippet!)}
                >
                  {adoptedId === p.id ? copy.notesAdoptedPlaybook : copy.notesAdoptPlaybook}
                </button>
              ) : null}
              {p.href ? (
                <Link href={p.href} className="inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:border-zinc-500">
                  {copy.notesMirrorAction}
                </Link>
              ) : null}
              <button
                type="button"
                className="text-xs text-zinc-400 hover:text-zinc-400"
                onClick={() => onDismiss(p.id)}
              >
                {copy.notesDismissPromotion}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
