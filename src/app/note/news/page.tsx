import type { Metadata } from "next";

import { NoteNewsView } from "@/components/note/note-news-view";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "News · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteNewsPage() {
  return (
    <NoteShell>
      <NoteNewsView />
    </NoteShell>
  );
}
