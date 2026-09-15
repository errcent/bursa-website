import { Suspense } from "react";
import type { Metadata } from "next";

import { NoteJournalView } from "@/components/note/note-journal-view";
import { NoteLoadingLine } from "@/components/note/note-loading-line";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Journal · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteJournalPage() {
  return (
    <NoteShell title="Journal">
      <Suspense fallback={<NoteLoadingLine journal />}>
        <NoteJournalView />
      </Suspense>
    </NoteShell>
  );
}
