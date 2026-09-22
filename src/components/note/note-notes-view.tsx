"use client";

import Link from "next/link";

import { NoteBeliefCapture } from "@/components/note/note-belief-capture";
import { NoteBeliefList } from "@/components/note/note-belief-list";
import { NoteBeliefPromotions } from "@/components/note/note-belief-promotions";
import { NoteLoadingLine } from "@/components/note/note-loading-line";
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
    return <NoteLoadingLine />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <NoteSectionIntro sectionId="notes" />

      <NoteBeliefCapture />

      <NoteBeliefPromotions entries={entries} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-300">{copy.notesStreamTitle}</h2>
        <Link
          href="/note/baru?layer=notes"
          className="inline-flex min-h-9 coarse:min-h-11 items-center px-2 text-xs text-zinc-400 hover:text-zinc-200"
        >
          {copy.notesAdvancedLink}
        </Link>
      </div>

      <NoteBeliefList entries={entries} allEntries={entries} />
    </div>
  );
}
