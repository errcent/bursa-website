"use client";

import { useCallback, useEffect, useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import type { JournalAccount } from "@/lib/note/accounts";
import type { CycleMethod } from "@/lib/note/position/types";

/**
 * Journal account entities: lot method + per-ticker multipliers.
 * Imports and sync runs resolve the matching account by label.
 */
export function NoteAccountsManager() {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [accounts, setAccounts] = useState<JournalAccount[]>([]);
  const [label, setLabel] = useState("");
  const [method, setMethod] = useState<CycleMethod>("fifo");
  const [mults, setMults] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/note/accounts", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { accounts?: JournalAccount[] };
      if (res.ok) setAccounts(json.accounts ?? []);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save() {
    const multipliers: Record<string, number> = {};
    for (const part of mults.split(/[,\n]/)) {
      const [ticker, value] = part.split("=").map((s) => s.trim());
      const num = Number(value);
      if (ticker && Number.isFinite(num) && num > 0) multipliers[ticker.toUpperCase()] = num;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/note/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label: label.trim(), method, multipliers }),
      });
      const json = (await res.json().catch(() => ({}))) as { accounts?: JournalAccount[] };
      if (res.ok && json.accounts) {
        setAccounts(json.accounts);
        setLabel("");
        setMults("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/note/accounts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as { accounts?: JournalAccount[] };
      if (res.ok && json.accounts) setAccounts(json.accounts);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
      <p className="text-sm font-semibold text-zinc-100">{t("Akun jurnal", "Journal accounts")}</p>
      <p className="mt-0.5 text-xs leading-snug text-zinc-400">
        {t(
          "Metode lot + multiplier per akun. Impor dan sinkron memakai akun yang cocok.",
          "Lot method + multipliers per account. Imports and syncs use the matching account.",
        )}
      </p>
      {accounts.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <p className="min-w-0 truncate text-sm text-zinc-200">
                {a.label}
                <span className="ml-2 text-xs text-zinc-500">
                  {a.method}
                  {Object.keys(a.multipliers).length > 0 ? ` · ${Object.keys(a.multipliers).length} mult` : ""}
                </span>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(a.id)}
                className="inline-flex min-h-9 coarse:min-h-11 shrink-0 items-center text-xs text-zinc-600 hover:text-rose-300 disabled:opacity-50"
              >
                {t("Hapus", "Delete")}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <input
          className="note-field min-h-9 coarse:min-h-11 text-sm text-zinc-100"
          placeholder={t("Label (mis. FTMO)", "Label (e.g. FTMO)")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label={t("Label akun", "Account label")}
        />
        <select
          className="note-field min-h-9 coarse:min-h-11 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value as CycleMethod)}
          aria-label={t("Metode lot", "Lot method")}
        >
          <option value="fifo">FIFO</option>
          <option value="lifo">LIFO</option>
          <option value="average">{t("Rata-rata", "Average")}</option>
        </select>
        <input
          className="note-field min-h-9 coarse:min-h-11 text-sm text-zinc-100"
          placeholder="ES=50, NQ=20"
          value={mults}
          onChange={(e) => setMults(e.target.value)}
          aria-label={t("Multiplier", "Multipliers")}
        />
      </div>
      <button
        type="button"
        disabled={busy || !label.trim()}
        onClick={() => void save()}
        className="mt-2 inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
      >
        {t("Simpan akun", "Save account")}
      </button>
    </div>
  );
}
