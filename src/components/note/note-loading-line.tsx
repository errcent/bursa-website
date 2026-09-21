"use client";

import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/** Layout-shaped loading instead of bare “Loading…” text. */
export function NoteLoadingLine({
  journal,
  className,
}: {
  journal?: boolean;
  className?: string;
}) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const label = journal ? copy.loadingJournal : copy.loading;

  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="h-3 w-40 animate-pulse rounded bg-zinc-800/80" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-900/60" />
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="h-16 animate-pulse rounded-lg bg-zinc-900/50" />
        <div className="h-16 animate-pulse rounded-lg bg-zinc-900/50" />
        <div className="h-16 animate-pulse rounded-lg bg-zinc-900/50" />
      </div>
    </div>
  );
}
