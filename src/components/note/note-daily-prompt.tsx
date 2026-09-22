"use client";

import { useEffect, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { dayKey, summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * One-question daily prompt (v3 P2).
 *
 * Anti-Habit-mati: 1-tap, not a form.
 * - After trade: "Did you follow your rules?" Y/N
 * - After loss: "Take a 24h break?" Y/N
 * - After win: "Log this setup to Playbook?" Y/N
 *
 * Answers are stored in localStorage (not server) — zero friction.
 */

const PROMPT_KEY = "note-daily-prompts-v1";

interface PromptState {
  date: string;
  rulesFollowed: boolean | null;
  breakTaken: boolean | null;
  playbookLogged: boolean | null;
}

function loadPromptState(): PromptState | null {
  try {
    const raw = localStorage.getItem(PROMPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PromptState;
  } catch {
    return null;
  }
}

function savePromptState(state: PromptState) {
  try {
    localStorage.setItem(PROMPT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function NoteDailyPrompt() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [state, setState] = useState<PromptState | null>(null);
  const today = dayKey(new Date().toISOString());

  useEffect(() => {
    const saved = loadPromptState();
    if (!saved || saved.date !== today) {
      setState({ date: today, rulesFollowed: null, breakTaken: null, playbookLogged: null });
    } else {
      setState(saved);
    }
  }, [today]);

  if (!state || journal.loading || !journal.data) return null;

  const entries = (journal.data.entries ?? []).filter((e) => isPnlKind(e.kind));
  const todayEntries = entries.filter((e) => dayKey(e.openedAt) === today);
  if (todayEntries.length === 0) return null;

  const lastTrade = todayEntries[todayEntries.length - 1];
  const lastPnl = lastTrade.pnl ?? 0;
  const isLoss = lastPnl < 0;
  const isWin = lastPnl > 0;

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  function answer(field: keyof Omit<PromptState, "date">, value: boolean) {
    if (!state) return;
    const next = { ...state, [field]: value };
    setState(next);
    savePromptState(next);
  }

  const prompts: Array<{
    field: keyof Omit<PromptState, "date">;
    question: string;
    yesLabel: string;
    noLabel: string;
    tone: "up" | "down" | "warn" | "neutral";
  }> = [];

  // Always ask: did you follow your rules?
  if (state.rulesFollowed === null) {
    prompts.push({
      field: "rulesFollowed",
      question: t("Ikut aturan hari ini?", "Did you follow your rules today?"),
      yesLabel: t("Ya", "Yes"),
      noLabel: t("Tidak", "No"),
      tone: "neutral",
    });
  }

  // After loss: take a break?
  if (isLoss && state.breakTaken === null) {
    prompts.push({
      field: "breakTaken",
      question: t("Rugi terakhir. Jeda 24 jam?", "Last trade was a loss. Take a 24h break?"),
      yesLabel: t("Jeda", "Break"),
      noLabel: t("Lanjut", "Continue"),
      tone: "warn",
    });
  }

  // After win: log to playbook?
  if (isWin && state.playbookLogged === null) {
    prompts.push({
      field: "playbookLogged",
      question: t("Win bagus. Log setup ke Playbook?", "Nice win. Log setup to Playbook?"),
      yesLabel: t("Log", "Log"),
      noLabel: t("Skip", "Skip"),
      tone: "up",
    });
  }

  if (prompts.length === 0) return null;

  return (
    <div className="space-y-2">
      {prompts.map((p) => (
        <div
          key={p.field}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
            p.tone === "up" && "border-emerald-800/60 bg-emerald-950/20",
            p.tone === "down" && "border-rose-800/60 bg-rose-950/20",
            p.tone === "warn" && "border-amber-800/60 bg-amber-950/20",
            p.tone === "neutral" && "border-zinc-800/80 bg-zinc-900/30"
          )}
        >
          <p className="text-sm text-zinc-200">{p.question}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-14 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
              onClick={() => answer(p.field, true)}
            >
              {p.yesLabel}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-14 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => answer(p.field, false)}
            >
              {p.noLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
