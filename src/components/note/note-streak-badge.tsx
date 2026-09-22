"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { dayKey, summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Positive gamification: 7-day green badge (v3 P2).
 *
 * Anti-shame: rewards consistency, not volume.
 * "7 days with at least 1 logged trade" = green badge.
 * Skipping is fine (no shame), but consistency is celebrated.
 */
export function NoteStreakBadge() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  const streak = useMemo(() => {
    if (journal.loading || !journal.data) return { days: 0, green: false };
    const entries = (journal.data.entries ?? []).filter((e) => isPnlKind(e.kind));
    if (entries.length === 0) return { days: 0, green: false };

    // Build set of days with trades
    const tradeDays = new Set(entries.map((e) => dayKey(e.openedAt)));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d.toISOString());
      if (tradeDays.has(key)) {
        count++;
      } else {
        break;
      }
    }

    return { days: count, green: count >= 7 };
  }, [journal.data, journal.loading]);

  if (streak.days === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        streak.green
          ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-200"
          : "border-zinc-800/80 bg-zinc-900/40 text-zinc-300"
      )}
    >
      <span className={cn("text-sm", streak.green ? "text-emerald-400" : "text-zinc-400")}>
        {streak.green ? "🔥" : "📊"}
      </span>
      {streak.days} {t("hari beruntun", "day streak")}
      {streak.green ? ` · ${t("Badge hijau!", "Green badge!")}` : ""}
    </div>
  );
}
