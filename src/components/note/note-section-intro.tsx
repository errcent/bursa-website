"use client";

import { noteSection, type NoteSectionId } from "@/lib/note/sections";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

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
    <header className={className ?? "mb-5 max-w-2xl space-y-1.5 border-b border-zinc-800/60 pb-4"}>
      <p className="font-heading text-base font-medium text-zinc-200">{s.question[locale]}</p>
      <p className="text-sm leading-relaxed text-zinc-500">{s.scope[locale]}</p>
      <p className="text-[11px] leading-snug text-zinc-600">{s.boundary[locale]}</p>
    </header>
  );
}
