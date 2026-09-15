"use client";

import Link from "next/link";

import { useNotePrefs } from "@/lib/note/use-note-prefs";

/** Legacy route content - psychology lives in free-form notes, not structured tags. */
export function NotePsychologyView() {
  const [prefs] = useNotePrefs();
  const en = prefs.locale === "en";

  return (
    <div className="mx-auto max-w-lg space-y-4 text-sm text-zinc-400">
      <p>
        {en
          ? "We no longer use emotion dropdowns or analytics buckets. Write how you felt in journal notes - AI can link that to same-day performance later."
          : "Dropdown emosi dan bucket analytics sudah tidak dipakai. Tulis perasaan di catatan jurnal - nanti AI bisa kaitkan dengan performa hari yang sama."}
      </p>
      <Link href="/note/catatan" className="text-zinc-200 hover:underline">
        {en ? "Open Notes →" : "Buka Catatan →"}
      </Link>
    </div>
  );
}
