"use client";

import Link from "next/link";

import { NoteBeliefCapture } from "@/components/note/note-belief-capture";
import { NoteBeliefList } from "@/components/note/note-belief-list";
import { NoteBeliefPromotions } from "@/components/note/note-belief-promotions";
import { NoteSectionIntro } from "@/components/note/note-section-intro";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteNotesView() {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const journal = useNoteJournal();
  const entries = journal.data?.entries ?? [];

  if (journal.loading || !journal.data) {
    return <p className="text-sm text-zinc-400">{copy.loading}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <NoteSectionIntro sectionId="notes" />

      <NoteBeliefCapture />

      <NoteBeliefPromotions entries={entries} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{copy.notesStreamTitle}</h2>
        <Link
          href="/note/baru?layer=notes"
          className="text-xs text-zinc-400 hover:text-zinc-300"
        >
          {copy.notesAdvancedLink}
        </Link>
      </div>

      <NoteBeliefList entries={entries} allEntries={entries} />
    </div>
  );
}
