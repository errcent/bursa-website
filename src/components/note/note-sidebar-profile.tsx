"use client";

import { NoteProfileMenu } from "@/components/note/note-profile-menu";
import { useAuth } from "@/components/auth-provider";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

function initialFrom(session: { name?: string | null; email?: string | null }) {
  const src = session.name?.trim() || session.email?.trim() || "?";
  return src.charAt(0).toUpperCase();
}

export function NoteSidebarProfile() {
  const { session, isLoading } = useAuth();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);

  const trigger = (
    <div className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 hover:bg-zinc-900/80">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-100"
        aria-hidden
      >
        {isLoading ? "…" : session ? initialFrom(session) : "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">
          {isLoading ? "…" : session?.name?.trim() || session?.email || copy.belumMasuk}
        </p>
        {session?.email ? (
          <p className="truncate text-[10px] text-zinc-500">{session.email}</p>
        ) : (
          <p className="truncate text-[10px] text-zinc-500">
            {prefs.locale === "en" ? "Tap for preferences" : "Ketuk untuk preferensi"}
          </p>
        )}
      </div>
      <span className="shrink-0 text-zinc-500" aria-hidden>
        ⋯
      </span>
    </div>
  );

  return (
    <div className="mt-auto shrink-0 border-t border-zinc-800/80 px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <NoteProfileMenu trigger={trigger} />
    </div>
  );
}
