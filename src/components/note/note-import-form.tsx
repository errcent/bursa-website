"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { NoteAccountsManager } from "@/components/note/note-accounts-manager";
import { NoteBrokerSync } from "@/components/note/note-broker-sync";
import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteImportForm() {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pasteCsv, setPasteCsv] = useState("");
  const [pasteResult, setPasteResult] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; label: string }[]>([]);
  const [accountLabel, setAccountLabel] = useState("");

  useEffect(() => {
    fetch("/api/note/accounts", { credentials: "include" })
      .then((r) => r.json().catch(() => ({})))
      .then((json: { accounts?: { id: string; label: string }[] }) => {
        if (Array.isArray(json.accounts)) setAccounts(json.accounts);
      })
      .catch(() => {});
  }, []);

  async function submitFile(file: File) {
    setPending(true);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    if (accountLabel.trim()) body.set("account", accountLabel.trim());
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) {
      setError(prefs.locale === "en" ? "Choose a CSV file." : "Pilih file CSV.");
      return;
    }
    await submitFile(file);
  }

  async function submitPaste() {
    if (!pasteCsv.trim()) return;
    setPending(true);
    setError(null);
    setPasteResult(null);
    const res = await fetch("/api/note/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: pasteCsv, accountLabel: accountLabel.trim() || undefined }),
    });
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
    setPasteResult(
      prefs.locale === "en"
        ? `Imported ${json.imported ?? 0} trades.`
        : `Terimpor ${json.imported ?? 0} trade.`
    );
    setPasteCsv("");
    setTimeout(() => router.push("/note"), 800);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* v3: Paste CSV (zero-friction) */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
        <label className="block">
          <span className="text-xs font-medium text-zinc-400">
            {prefs.locale === "en" ? "Paste CSV (faster)" : "Tempel CSV (lebih cepat)"}
          </span>
          <textarea
            rows={6}
            className="note-field mt-1 min-h-[8rem] resize-y py-2 text-zinc-100 placeholder:text-zinc-400"
            value={pasteCsv}
            onChange={(e) => setPasteCsv(e.target.value)}
            placeholder={prefs.locale === "en" ? "symbol,side,qty,entry,exit,pnl,date\nEURUSD,BUY,0.1,1.085,1.09,5,2026-09-22" : "symbol,side,qty,entry,exit,pnl,date\nEURUSD,BUY,0.1,1.085,1.09,5,2026-09-22"}
            aria-label={prefs.locale === "en" ? "Paste CSV" : "Tempel CSV"}
          />
        </label>
        {pasteCsv.trim() ? (
          <button
            type="button"
            className="mt-2 inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
            onClick={submitPaste}
            disabled={pending}
          >
            {pending
              ? prefs.locale === "en" ? "Importing..." : "Mengimpor..."
              : prefs.locale === "en" ? "Import paste" : "Impor tempelan"}
          </button>
        ) : null}
        {pasteResult ? <p className="mt-2 text-sm text-emerald-300">{pasteResult}</p> : null}
      </div>

      <NoteBrokerSync />

      <NoteAccountsManager />

      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
        <label className="block">
          <span className="text-xs font-medium text-zinc-400">
            {prefs.locale === "en" ? "Import into account (method + multipliers)" : "Impor ke akun (metode + multiplier)"}
          </span>
          <select
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm"
            value={accountLabel}
            onChange={(e) => setAccountLabel(e.target.value)}
            aria-label={prefs.locale === "en" ? "Target account" : "Akun tujuan"}
          >
            <option value="">{prefs.locale === "en" ? "Default (FIFO)" : "Default (FIFO)"}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.label}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-zinc-400">{copy.importFileHint}</p>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">{copy.importFile}</span>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="block min-h-9 coarse:min-h-11 w-full text-sm text-zinc-300 file:mr-3 file:min-h-9 file:coarse:min-h-11 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:text-zinc-100"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="min-h-9 coarse:min-h-11">
            {pending ? (prefs.locale === "en" ? "Importing…" : "Mengimpor…") : copy.impor}
          </Button>
          <Button type="button" variant="ghost" className="min-h-9 coarse:min-h-11" onClick={() => router.push("/note")}>
            {copy.batal}
          </Button>
        </div>
      </form>
    </div>
  );
}
