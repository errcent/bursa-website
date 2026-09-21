"use client";

import { NoteJournalDatabase } from "@/components/note/note-journal-database";

export function NoteJournalView() {
  return (
    <div className="mx-auto max-w-[100rem]">
      <NoteJournalDatabase />
    </div>
  );
}
