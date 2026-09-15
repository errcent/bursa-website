import type { Metadata } from "next";

import { NoteAnalyticsView } from "@/components/note/note-analytics-view";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Analytics · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteAnalyticsPage() {
  return (
    <NoteShell title="Analytics">
      <NoteAnalyticsView />
    </NoteShell>
  );
}
