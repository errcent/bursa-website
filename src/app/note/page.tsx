import type { Metadata } from "next";

import { NoteOverview } from "@/components/note/note-overview";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Overview · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NotePage() {
  return (
    <NoteShell title="Overview">
      <NoteOverview />
    </NoteShell>
  );
}
