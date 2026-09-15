import type { Metadata } from "next";

import { NoteNotesView } from "@/components/note/note-notes-view";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Notes · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteCatatanPage() {
  return (
    <NoteShell title="Notes">
      <NoteNotesView />
    </NoteShell>
  );
}
