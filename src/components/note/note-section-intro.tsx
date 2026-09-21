"use client";

import { noteSection, type NoteSectionId } from "@/lib/note/sections";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/** One decision question under the page H1. Scope/boundary stay in docs, not chrome. */
export function NoteSectionIntro({
  sectionId,
  className,
}: {
  sectionId: NoteSectionId;
  className?: string;
}) {
  const [prefs] = useNotePrefs();
  const s = noteSection(sectionId);
  const locale = prefs.locale;

  return (
    <p className={cn("mb-4 max-w-2xl text-sm leading-relaxed text-zinc-400", className)}>
      {s.question[locale]}
    </p>
  );
}
