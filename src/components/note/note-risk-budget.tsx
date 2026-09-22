"use client";

import { useEffect, useMemo, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { dayKey, summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Risk budget guardrail (v3 P2).
 *
 * "Daily risk budget: $200. Used: $80. Remaining: $120."
 * When exhausted: "Risk budget used. Come back tomorrow." (soft warning)
 *
 * Not a hard lock — a guardrail that warns, not blocks.
 */

const RISK_BUDGET_KEY = "note-risk-budget-v1";

function loadRiskBudget(): number {
  try {
    const raw = localStorage.getItem(RISK_BUDGET_KEY);
    if (!raw) return 0;
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

function saveRiskBudget(n: number) {
  try {
    localStorage.setItem(RISK_BUDGET_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function NoteRiskBudget() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [budget, setBudget] = useState(0);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const b = loadRiskBudget();
    setBudget(b);
    setInputValue(String(b || ""));
  }, []);

  const today = dayKey(new Date().toISOString());

  const todayLoss = useMemo(() => {
    if (journal.loading || !journal.data) return 0;
    const entries = (journal.data.entries ?? []).filter((e) => isPnlKind(e.kind));
    const todayEntries = entries.filter((e) => dayKey(e.openedAt) === today);
    const summary = summarizeJournal(todayEntries);
    return Math.abs(Math.min(0, summary.pnlSum ?? 0));
  }, [journal.data, journal.loading, today]);

  const used = todayLoss;
  const remaining = Math.max(0, budget - used);
  const exhausted = budget > 0 && used >= budget;

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  function saveBudget() {
    const n = Number(inputValue) || 0;
    setBudget(n);
    saveRiskBudget(n);
    setEditing(false);
  }

  if (budget === 0 && !editing) {
    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
        <p className="text-xs text-zinc-400">
          {t(
            "Belum ada anggaran risiko harian. Set untuk aktifkan pengaman.",
            "No daily risk budget set. Set one to enable the guardrail."
          )}
        </p>
        <button
          type="button"
          className="mt-2 inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
          onClick={() => setEditing(true)}
        >
          {t("Set anggaran", "Set budget")}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        exhausted
          ? "border-rose-800/60 bg-rose-950/30"
          : "border-zinc-800/80 bg-zinc-900/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {t("Anggaran risiko harian", "Daily risk budget")}
        </p>
        <button
          type="button"
          className="text-xs text-zinc-500 hover:text-zinc-300"
          onClick={() => setEditing(!editing)}
        >
          {t("Edit", "Edit")}
        </button>
      </div>

      {editing ? (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            className="note-field min-h-11 w-32 text-zinc-100"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label={t("Anggaran", "Budget")}
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
            onClick={saveBudget}
          >
            {t("Simpan", "Save")}
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">{t("Dipakai", "Used")}</span>
            <span className="text-sm tabular-nums text-zinc-200">
              {used.toLocaleString()} / {budget.toLocaleString()}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                exhausted ? "bg-rose-500" : remaining / budget < 0.5 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${budget > 0 ? Math.min(100, (used / budget) * 100) : 0}%` }}
            />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">{t("Sisa", "Remaining")}</span>
            <span className={cn("text-sm tabular-nums font-medium", exhausted ? "text-rose-300" : "text-zinc-200")}>
              {remaining.toLocaleString()}
            </span>
          </div>
          {exhausted ? (
            <p className="mt-1 text-xs text-rose-300">
              {t(
                "Anggaran risiko habis. Saran: istirahat, kembali besok.",
                "Risk budget exhausted. Suggest: rest, come back tomorrow."
              )}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
