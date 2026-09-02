import type { Metadata } from "next";

import { NoteHome } from "@/components/note/note-home";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Bursa Note",
  description:
    "Jurnal privat untuk mencatat trade & invest: PnL, posisi, dan refleksi. Bukan catatan lesson.",
  robots: { index: false, follow: false },
};

export default function NotePage() {
  return (
    <NoteShell
      title="Jurnal Trade & Invest"
      description="Privat. Dua fokus: lacak PnL, dan selesaikan pola yang berulang. Lesson Notes di kelas tetap terpisah."
    >
      <NoteHome />
    </NoteShell>
  );
}
