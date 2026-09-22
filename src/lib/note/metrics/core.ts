/**
 * Core trade metrics (wraps stats.ts, no rewrites).
 * Counts, wins/losses, profit factor, expectancy, streaks.
 */

import { summarizeJournal, type JournalSnapshot } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";
import type { FxContext } from "@/lib/note/fx/types";

export interface CoreMetrics extends JournalSnapshot {
  maxWinStreak: number;
  maxLossStreak: number;
  /** Positive = live win streak, negative = live loss streak. */
  liveStreak: number;
}

export function computeCoreMetrics(entries: JournalEntry[], fx?: FxContext): CoreMetrics {
  const snapshot = summarizeJournal(entries, fx);
  const ordered = entries
    .filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open")
    .sort((a, b) => (a.openedAt < b.openedAt ? -1 : 1));
  let bestWinRun = 0;
  let bestLossRun = 0;
  let liveDir = 0;
  let liveLen = 0;
  for (const trade of ordered) {
    const pnl = trade.pnl ?? 0;
    if (pnl === 0) continue;
    const dir = pnl > 0 ? 1 : -1;
    if (dir === liveDir) {
      liveLen += 1;
    } else {
      liveDir = dir;
      liveLen = 1;
    }
    if (dir > 0) bestWinRun = Math.max(bestWinRun, liveLen);
    else bestLossRun = Math.max(bestLossRun, liveLen);
  }
  return { ...snapshot, maxWinStreak: bestWinRun, maxLossStreak: bestLossRun, liveStreak: liveDir * liveLen };
}
