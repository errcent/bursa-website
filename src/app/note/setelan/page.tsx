import type { Metadata } from "next";

import { NoteSettingsForm } from "@/components/note/note-settings-form";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Setelan · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteSettingsPage() {
  return (
    <NoteShell title="Setelan">
      <NoteSettingsForm />
    </NoteShell>
  );
}
