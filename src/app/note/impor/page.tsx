import type { Metadata } from "next";

import { NoteImportForm } from "@/components/note/note-import-form";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Impor · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteImportPage() {
  return (
    <NoteShell title="Impor">
      <NoteImportForm />
    </NoteShell>
  );
}
