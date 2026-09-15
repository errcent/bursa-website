import type { Metadata } from "next";

import { NotePlaybookView } from "@/components/note/note-playbook-view";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Playbook · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NotePlaybookPage() {
  return (
    <NoteShell title="Playbook">
      <NotePlaybookView />
    </NoteShell>
  );
}
