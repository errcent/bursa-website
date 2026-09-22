"use client";

import { useCallback, useEffect, useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { DEFAULT_JOURNAL_DEFAULTS, type JournalDefaults } from "@/lib/note/defaults";

/**
 * Journal defaults editor: breakeven band, fallback fee, global
 * multipliers, statement timezone. Applied at import/sync time.
 */
export function NoteJournalDefaults() {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [defaults, setDefaults] = useState<JournalDefaults>(DEFAULT_JOURNAL_DEFAULTS);
  const [band, setBand] = useState("0");
  const [fee, setFee] = useState("0");
  const [mults, setMults] = useState("");
  const [tz, setTz] = useState("Asia/Jakarta");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/note/defaults", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { defaults?: JournalDefaults };
      if (res.ok && json.defaults) {
        setDefaults(json.defaults);
        setBand(String(json.defaults.breakevenBand));
        setFee(String(json.defaults.defaultFee));
        setMults(Object.entries(json.defaults.multipliers).map(([k, v]) => `${k}=${v}`).join(", "));
        setTz(json.defaults.statementTz);
      }
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
    setSaved(false);
    try {
      const res = await fetch("/api/note/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          breakevenBand: Number(band) || 0,
          defaultFee: Number(fee) || 0,
          multipliers,
          statementTz: tz.trim() || "Asia/Jakarta",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { defaults?: JournalDefaults };
      if (res.ok && json.defaults) {
        setDefaults(json.defaults);
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  }

  void defaults;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
      <p className="text-sm font-semibold text-zinc-100">{t("Default jurnal", "Journal defaults")}</p>
      <p className="mt-0.5 text-xs leading-snug text-zinc-400">
        {t(
          "Berlaku saat impor/sinkron. Tidak menulis ulang data lama.",
          "Applied at import/sync time. Never rewrites old data.",
        )}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Band impas (|PnL| ≤ …)", "Breakeven band (|PnL| ≤ …)")}</span>
          <input
            type="number"
            min={0}
            step="any"
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            value={band}
            onChange={(e) => setBand(e.target.value)}
            aria-label={t("Band impas", "Breakeven band")}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Fee default", "Default fee")}</span>
          <input
            type="number"
            min={0}
            step="any"
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            aria-label={t("Fee default", "Default fee")}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Multiplier (TICKER=nilai)", "Multipliers (TICKER=value)")}</span>
          <input
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            placeholder="ES=50, NQ=20"
            value={mults}
            onChange={(e) => setMults(e.target.value)}
            aria-label={t("Multiplier", "Multipliers")}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Zona waktu statement", "Statement timezone")}</span>
          <input
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            placeholder="Asia/Jakarta"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            aria-label={t("Zona waktu statement", "Statement timezone")}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
        >
          {t("Simpan default", "Save defaults")}
        </button>
        {saved ? <p className="text-xs text-emerald-300">{t("Tersimpan.", "Saved.")}</p> : null}
      </div>
    </div>
  );
}
