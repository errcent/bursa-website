"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { buildBeliefPromotions } from "@/lib/note/cognition/promotions";
import { dismissPromotion, loadDismissedPromotions } from "@/lib/note/cognition/promotion-dismiss";
import { loadBeliefLinks } from "@/lib/note/cognition/links";
import { adoptBeliefSnippetToPlaybook } from "@/lib/note/playbook/adopt-belief";
import { loadPlaybook, savePlaybook } from "@/lib/note/playbook/storage";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NotePlaybookNotesBridge() {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const locale = prefs.locale;
  const journal = useNoteJournal();
  const entries = journal.data?.entries ?? [];
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissedPromotions());
  const [adoptedId, setAdoptedId] = useState<string | null>(null);

  const [linkedCount, setLinkedCount] = useState(0);

  useEffect(() => {
    const links = loadBeliefLinks();
    setLinkedCount(Object.values(links).filter((l) => l.playbookSetupId).length);
  }, [entries.length]);

  const candidates = useMemo(
    () =>
      buildBeliefPromotions(entries, locale).filter(
        (p) => p.kind === "playbook_candidate" && p.beliefSnippet && !dismissed.has(p.id)
      ),
    [entries, locale, dismissed]
  );

  const top = candidates[0];

  const onAdopt = useCallback(
    (id: string, snippet: string) => {
      savePlaybook(adoptBeliefSnippetToPlaybook(loadPlaybook(), snippet, locale));
      setAdoptedId(id);
    },
    [locale]
  );

  const onDismiss = useCallback((id: string) => {
    dismissPromotion(id);
    setDismissed((prev) => new Set([...prev, id]));
  }, []);

  if (!top && linkedCount === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {copy.playbookNotesBridgeTitle}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">{copy.playbookNotesBridgeHint}</p>
        </div>
        <Link href="/note/catatan" className="text-xs text-zinc-400 hover:text-zinc-200">
          {copy.playbookNotesBridgeOpen}
        </Link>
      </div>
      {linkedCount > 0 ? (
        <p className="mt-2 text-xs text-zinc-400">
          {locale === "en"
            ? `${linkedCount} belief note(s) linked to a setup.`
            : `${linkedCount} belief note terhubung ke setup.`}
        </p>
      ) : null}
      {top ? (
        <div className="mt-3 rounded-md border border-zinc-800/80 px-3 py-2">
          <p className="text-sm text-zinc-300">{top.detail[locale]}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-2.5 text-xs font-semibold text-zinc-900 hover:bg-white"
              onClick={() => onAdopt(top.id, top.beliefSnippet!)}
            >
              {adoptedId === top.id ? copy.notesAdoptedPlaybook : copy.notesAdoptPlaybook}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center text-xs text-zinc-400 hover:text-zinc-200"
              onClick={() => onDismiss(top.id)}
            >
              {copy.notesDismissPromotion}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
