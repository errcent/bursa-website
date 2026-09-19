"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteImportForm() {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) {
      setError(prefs.locale === "en" ? "Choose a CSV file." : "Pilih file CSV.");
      return;
    }
    setPending(true);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/note/import", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { error?: string; imported?: number };
    setPending(false);
    if (res.status === 401) {
      window.location.href = noteSsoStartHref("/note/impor");
      return;
    }
    if (!res.ok) {
      setError(json.error ?? (prefs.locale === "en" ? "Import failed." : "Impor gagal."));
      return;
    }
    router.push("/note");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <p className="text-sm text-zinc-400">{copy.importFileHint}</p>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-400">{copy.importFile}</span>
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          className="block min-h-11 w-full text-sm text-zinc-300 file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:text-zinc-100"
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? (prefs.locale === "en" ? "Importing…" : "Mengimpor…") : copy.impor}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => router.push("/note")}>
          {copy.batal}
        </Button>
      </div>
    </form>
  );
}
