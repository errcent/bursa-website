import type { Metadata } from "next";

import { NoteShell } from "@/components/note/note-shell";
import { NotePropView } from "@/components/note/note-prop-view";

export const metadata: Metadata = {
  title: "Prop Firms · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NotePropPage() {
  return (
    <NoteShell title="Prop Firms">
      <NotePropView />
    </NoteShell>
  );
}
