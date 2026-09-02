import type { Metadata } from "next";

import { NoteImportForm } from "@/components/note/note-import-form";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Impor CSV · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteImportPage() {
  return (
    <NoteShell
      title="Impor CSV"
      description="Tanpa password broker. Header yang dikenali: symbol/ticker, side, qty, entry, exit, pnl, date."
    >
      <NoteImportForm />
    </NoteShell>
  );
}
