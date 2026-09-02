import type { Metadata } from "next";

import { NoteEntryForm } from "@/components/note/note-entry-form";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Baru · Bursa Note",
  robots: { index: false, follow: false },
};

export default async function NoteNewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : null;

  return (
    <NoteShell title="Baru">
      <NoteEntryForm initialDate={date} />
    </NoteShell>
  );
}
