"use client";

import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteSectionPlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);

  return (
    <div className="max-w-lg space-y-2 rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center">
      <h2 className="font-heading text-lg font-semibold text-zinc-100">{title}</h2>
      <p className="text-sm text-zinc-400">{body}</p>
      <p className="text-xs text-zinc-400">{copy.underDev}</p>
    </div>
  );
}
