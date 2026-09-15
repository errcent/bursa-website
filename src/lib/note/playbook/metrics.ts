import { dayKey } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

import type { JournalGateMetrics } from "@/lib/note/playbook/types";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function journalGateMetrics(entries: JournalEntry[], nowIso = new Date().toISOString()): JournalGateMetrics {
  const today = dayKey(nowIso);
  const pnlRows = entries.filter((e) => isPnlKind(e.kind));
  const todayRows = pnlRows.filter((e) => dayKey(e.openedAt) === today);

  let dailyPnl = 0;
  for (const e of todayRows) {
    if (e.pnl != null) dailyPnl += e.pnl;
  }

  const closedToday = [...todayRows]
    .filter((e) => e.result === "win" || e.result === "loss" || e.result === "be")
    .sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));

  let consecutiveLosses = 0;
  for (let i = closedToday.length - 1; i >= 0; i -= 1) {
    if (closedToday[i].result === "loss") consecutiveLosses += 1;
    else break;
  }

  const weekAgo = Date.parse(nowIso) - 7 * 24 * 60 * 60 * 1000;
  const tradesLast7Days = pnlRows.filter((e) => Date.parse(e.openedAt) >= weekAgo).length;

  const sorted = [...pnlRows].sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));
  let reentryAfterLossCount = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.result !== "loss") continue;
    const delta = Date.parse(cur.openedAt) - Date.parse(prev.openedAt);
    if (delta >= 0 && delta <= TWO_HOURS_MS) reentryAfterLossCount += 1;
  }

  let winStreak = 0;
  for (let i = closedToday.length - 1; i >= 0; i -= 1) {
    if (closedToday[i].result === "win") winStreak += 1;
    else break;
  }

  return {
    tradesToday: todayRows.length,
    dailyPnl,
    openCount: pnlRows.filter((e) => e.result === "open").length,
    consecutiveLosses,
    tradesLast7Days,
    reentryAfterLossCount,
    winStreak,
  };
}

export function lastClosedLossIso(entries: JournalEntry[]): string | null {
  const losses = entries
    .filter((e) => isPnlKind(e.kind) && e.result === "loss")
    .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
  return losses[0]?.openedAt ?? null;
}

/** Minutes since most recent closed loss (null if none). */
export function minutesSinceLastLoss(entries: JournalEntry[], nowIso = new Date().toISOString()): number | null {
  const pnlRows = entries.filter((e) => isPnlKind(e.kind) && e.result === "loss");
  if (!pnlRows.length) return null;
  const last = pnlRows.reduce((best, e) => (Date.parse(e.openedAt) > Date.parse(best.openedAt) ? e : best));
  const delta = Date.parse(nowIso) - Date.parse(last.openedAt);
  return delta / 60_000;
}
