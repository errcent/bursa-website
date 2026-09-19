import type { Metadata } from "next";

import { NoteShell } from "@/components/note/note-shell";
import { NoteTrackView } from "@/components/note/note-track-view";

export const metadata: Metadata = {
  title: "Track · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteTrackPage() {
  return (
    <NoteShell title="Track">
      <NoteTrackView />
    </NoteShell>
  );
}
