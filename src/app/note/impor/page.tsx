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
      <p className="mb-6 max-w-lg text-sm text-zinc-500">
        CSV. Header: symbol, side, qty, entry, exit, pnl, date. Tanpa password broker.
      </p>
      <NoteImportForm />
    </NoteShell>
  );
}
