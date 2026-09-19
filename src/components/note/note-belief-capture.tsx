"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteBeliefCapture() {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const note = text.trim();
    if (!note || pending) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/note/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "REFLEKSI",
        mode: "cepat",
        symbol: "NOTE",
        side: "NOTE",
        note,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (res.status === 401) {
      window.location.href = noteSsoStartHref("/note/catatan");
      return;
    }
    if (!res.ok) {
      setError(body.error ?? copy.notesSaveError);
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 sm:p-4">
      <label className="sr-only" htmlFor="belief-capture">
        {copy.notesCapturePlaceholder}
      </label>
      <textarea
        id="belief-capture"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={copy.notesCapturePlaceholder}
        className="note-field min-h-[5.5rem] w-full resize-y py-2.5 placeholder:text-zinc-400"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
        }}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-400">{copy.notesCaptureHint}</p>
        <button
          type="button"
          disabled={!text.trim() || pending}
          onClick={() => void submit()}
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
        >
          {pending ? copy.menyimpan : copy.notesCaptureSave}
        </button>
      </div>
      {error ? <p className="note-pnl-down mt-2 text-xs">{error}</p> : null}
    </div>
  );
}
