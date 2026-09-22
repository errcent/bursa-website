"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Emotion vs P&L correlation (v3 P2).
 *
 * Not a 600-metric chart. ONE sentence:
 * "When you feel 'confident', you win 71%.
 *  When 'anxious', you lose 68%."
 */
export function NoteEmotionCorrelation() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  const correlation = useMemo(() => {
    if (journal.loading || !journal.data) return null;
    const trades = (journal.data.entries ?? []).filter(
      (e) => isPnlKind(e.kind) && e.pnl != null && e.emotion
    );
    if (trades.length < 5) return null;

    const byEmotion = new Map<string, { wins: number; total: number; pnl: number }>();
    for (const tr of trades) {
      const emo = tr.emotion ?? "unknown";
      let stat = byEmotion.get(emo);
      if (!stat) {
        stat = { wins: 0, total: 0, pnl: 0 };
        byEmotion.set(emo, stat);
      }
      stat.total++;
      stat.pnl += tr.pnl ?? 0;
      if ((tr.pnl ?? 0) > 0) stat.wins++;
    }

    // Find best and worst emotion
    let best: { emo: string; winRate: number; count: number } | null = null;
    let worst: { emo: string; winRate: number; count: number } | null = null;
    for (const [emo, stat] of byEmotion) {
      if (stat.total < 2) continue;
      const winRate = stat.wins / stat.total;
      if (!best || winRate > best.winRate) best = { emo, winRate, count: stat.total };
      if (!worst || winRate < worst.winRate) worst = { emo, winRate, count: stat.total };
    }

    if (!best || !worst || best.emo === worst.emo) return null;
    return { best, worst };
  }, [journal.data, journal.loading]);

  if (!correlation) return null;

  const bestPct = Math.round(correlation.best.winRate * 100);
  const worstPct = Math.round(correlation.worst.winRate * 100);

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {t("Emosi vs hasil", "Emotion vs outcome")}
      </p>
      <p className="mt-1 text-sm text-zinc-200">
        {t(
          `Saat "${correlation.best.emo}", menang ${bestPct}%. Saat "${correlation.worst.emo}", kalah ${100 - worstPct}%.`,
          `When "${correlation.best.emo}", you win ${bestPct}%. When "${correlation.worst.emo}", you lose ${100 - worstPct}%.`
        )}
      </p>
    </div>
  );
}
