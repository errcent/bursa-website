import type { Metadata } from "next";

import { NoteProfilePage } from "@/components/note/note-profile-page";
import { NoteShell } from "@/components/note/note-shell";

export const metadata: Metadata = {
  title: "Profil · Bursa Note",
  robots: { index: false, follow: false },
};

export default function NoteProfilRoute() {
  return (
    <NoteShell title="Profil">
      <NoteProfilePage />
    </NoteShell>
  );
}
