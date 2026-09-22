"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { dayKey } from "@/lib/note/stats";
import {
  EMPTY_ROUTINES,
  routineScore,
  routinesForDate,
  type RoutinePhase,
  type RoutinesState,
} from "@/lib/note/routines";
import { cn } from "@/lib/utils";

/**
 * Session routines + missed-trade log.
 * Misses live here only — they never enter entries or metrics.
 */
export function NoteRoutines() {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [state, setState] = useState<RoutinesState>(EMPTY_ROUTINES);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [phase, setPhase] = useState<RoutinePhase>("pre");
  const [showMiss, setShowMiss] = useState(false);
  const [missSymbol, setMissSymbol] = useState("");
  const [missReason, setMissReason] = useState("");

  const today = useMemo(() => dayKey(new Date().toISOString()), []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/note/routines", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { routines?: RoutinesState };
      if (res.ok && json.routines) setState(json.routines);
    } catch {
      /* offline */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function act(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/note/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, payload }),
      });
      const json = (await res.json().catch(() => ({}))) as { routines?: RoutinesState };
      if (res.ok && json.routines) {
        setState(json.routines);
        setLabel("");
        setMissSymbol("");
        setMissReason("");
        setShowMiss(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const scheduled = useMemo(() => routinesForDate(state.items, today), [state.items, today]);
  const score = useMemo(() => routineScore(state, today), [state, today]);
  const phases: { id: RoutinePhase; label: string }[] = [
    { id: "pre", label: t("Pra-sesi", "Pre-session") },
    { id: "during", label: t("Saat sesi", "During session") },
    { id: "post", label: t("Pasca-sesi", "Post-session") },
  ];

  if (!loaded) return null;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {t("Rutinitas hari ini", "Today's routines")}
        </p>
        {score != null ? (
          <p className="text-xs tabular-nums text-zinc-300">{Math.round(score * 100)}%</p>
        ) : null}
      </div>

      {scheduled.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">
          {t("Belum ada rutinitas. Tambah satu di bawah.", "No routines yet. Add one below.")}
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {phases.map((ph) => {
            const items = scheduled.filter((i) => i.phase === ph.id);
            if (items.length === 0) return null;
            return (
              <li key={ph.id}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{ph.label}</p>
                <ul className="mt-1 space-y-1">
                  {items.map((item) => {
                    const done = (state.checks[today] ?? []).includes(item.id);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void act("toggle-check", { itemId: item.id, date: today })}
                          aria-pressed={done}
                          className="flex min-h-9 coarse:min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left hover:bg-zinc-900/60"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border text-[11px]",
                              done ? "border-emerald-700 bg-emerald-900/50 text-emerald-300" : "border-zinc-700 text-transparent",
                            )}
                          >
                            ✓
                          </span>
                          <span className={cn("text-sm", done ? "text-zinc-500 line-through" : "text-zinc-200")}>
                            {item.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          className="note-field min-h-9 coarse:min-h-11 flex-1 text-sm text-zinc-100"
          placeholder={t("Rutinitas baru…", "New routine…")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label={t("Rutinitas baru", "New routine")}
        />
        <select
          className="note-field min-h-9 coarse:min-h-11 text-sm"
          value={phase}
          onChange={(e) => setPhase(e.target.value as RoutinePhase)}
          aria-label={t("Fase", "Phase")}
        >
          {phases.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !label.trim()}
          onClick={() => void act("add-item", { label: label.trim(), phase, weekdays: [] })}
          className="inline-flex min-h-9 coarse:min-h-11 shrink-0 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
        >
          {t("Tambah", "Add")}
        </button>
      </div>

      <div className="mt-4 border-t border-zinc-800/70 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {t("Peluang terlewat (di luar metrik)", "Missed trades (outside metrics)")}
          </p>
          <button
            type="button"
            onClick={() => setShowMiss((v) => !v)}
            className="inline-flex min-h-9 coarse:min-h-11 items-center text-xs text-zinc-400 hover:text-zinc-200"
          >
            {showMiss ? t("Tutup", "Close") : t("+ Catat", "+ Log")}
          </button>
        </div>
        {showMiss ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <input
              className="note-field min-h-9 coarse:min-h-11 text-sm text-zinc-100"
              placeholder="EURUSD"
              value={missSymbol}
              onChange={(e) => setMissSymbol(e.target.value.toUpperCase())}
              aria-label={t("Simbol", "Symbol")}
            />
            <input
              className="note-field min-h-9 coarse:min-h-11 text-sm text-zinc-100 sm:col-span-2"
              placeholder={t("Kenapa terlewat?", "Why missed?")}
              value={missReason}
              onChange={(e) => setMissReason(e.target.value)}
              aria-label={t("Alasan", "Reason")}
            />
            <button
              type="button"
              disabled={busy || !missSymbol.trim() || !missReason.trim()}
              onClick={() => void act("log-miss", { date: today, symbol: missSymbol.trim(), direction: null, reason: missReason.trim(), thesis: null })}
              className="inline-flex min-h-9 coarse:min-h-11 items-center justify-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50 sm:col-span-3"
            >
              {t("Simpan miss", "Save miss")}
            </button>
          </div>
        ) : null}
        {state.misses.length > 0 ? (
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto" role="region" tabIndex={0} aria-label={t("Peluang terlewat", "Missed trades")}>
            {state.misses.slice(0, 10).map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2 text-xs">
                <p className="min-w-0 text-zinc-300">
                  <span className="font-medium">{m.symbol}</span>
                  <span className="text-zinc-500"> · {m.date}</span>
                  <span className="block truncate text-zinc-400">{m.reason}</span>
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act("delete-miss", { missId: m.id })}
                  className="inline-flex min-h-9 coarse:min-h-11 shrink-0 items-center text-zinc-600 hover:text-rose-300"
                  aria-label={t("Hapus", "Delete")}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
