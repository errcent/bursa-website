"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function NoteImportForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) {
      setError("Pilih file CSV.");
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
      window.location.href = `/api/note/sso/start?next=${encodeURIComponent("/note/impor")}`;
      return;
    }
    if (!res.ok) {
      setError(json.error ?? "Impor gagal.");
      return;
    }
    router.push("/note");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <input
        name="file"
        type="file"
        accept=".csv,text/csv"
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Mengimpor…" : "Impor"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/note")}>
          Batal
        </Button>
      </div>
    </form>
  );
}
