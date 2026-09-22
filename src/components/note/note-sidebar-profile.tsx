"use client";

import { useEffect, useState } from "react";

import { NoteProfileMenu } from "@/components/note/note-profile-menu";
import { useAuth } from "@/components/auth-provider";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

function initialFrom(session: { name?: string | null; email?: string | null }) {
  const src = session.name?.trim() || session.email?.trim() || "?";
  return src.charAt(0).toUpperCase();
}

export function NoteSidebarProfile() {
  const { session } = useAuth();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nameLabel = mounted
    ? session?.name?.trim() || session?.email || copy.belumMasuk
    : copy.belumMasuk;
  const subLabel = mounted && session?.email ? session.email : copy.tapPrefs;
  const initial = mounted && session ? initialFrom(session) : "?";

  const trigger = (
    <div className="flex min-h-9 coarse:min-h-11 w-full items-center gap-2.5 rounded-md px-1 py-1 hover:bg-zinc-900/80">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-100"
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{nameLabel}</p>
        <p className="truncate text-xs text-zinc-400">{subLabel}</p>
      </div>
      <span className="shrink-0 text-zinc-400" aria-hidden>
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
