"use client";

import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteLoadingLine({ journal }: { journal?: boolean }) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  return <p className="text-sm text-zinc-400">{journal ? copy.loadingJournal : copy.loading}</p>;
}
