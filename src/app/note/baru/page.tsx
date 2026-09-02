import type { Metadata } from "next";

import { NoteEntryForm } from "@/components/note/note-entry-form";
import { NoteShell } from "@/components/note/note-shell";
import { JOURNAL_MODES, type JournalMode } from "@/lib/note/types";

export const metadata: Metadata = {
  title: "Entry baru · Bursa Note",
  robots: { index: false, follow: false },
};

export default async function NoteNewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = JOURNAL_MODES.includes(params.mode as JournalMode)
    ? (params.mode as JournalMode)
    : "cepat";

  return (
    <NoteShell
      title="Entry baru"
      description="Cepat 20–40 detik. Review setelah sesi. Klinik hanya saat pola berulang."
    >
      <NoteEntryForm initialMode={mode} />
    </NoteShell>
  );
}
