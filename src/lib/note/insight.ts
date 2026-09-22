/**
 * One-line insight engine (v3 P0).
 *
 * Anti-Habit-mati: not 600 metrics. ONE sentence.
 *
 * Research: "Diminta jadi analis data sebelum dibantu mengurangi trade bodoh."
 * Fix: one sentence that helps, not a dashboard that overwhelms.
 *
 * Insights are generated from JournalEntry[] and returned as
 * short, human-readable strings (ID or EN).
 */

import type { JournalEntry } from "@/lib/note/types";
import { actualRR } from "@/lib/note/r-multiple";
import { dayKey, filterEntries, summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import type { NoteLocale } from "@/lib/note/prefs";

export type InsightContext = "after-trade" | "end-of-day" | "end-of-week" | "after-loss";

export interface InsightInput {
  entries: JournalEntry[];
  locale: NoteLocale;
  context: InsightContext;
  /** The most recent trade (for after-trade / after-loss) */
  latestEntry?: JournalEntry;
}

export interface Insight {
  text: string;
  tone: "up" | "down" | "neutral" | "warn";
}

const t = (locale: NoteLocale, id: string, en: string) => (locale === "en" ? en : id);

/**
 * Generate a one-line insight.
 * Returns null if no meaningful insight can be generated.
 */
export function generateInsight(input: InsightInput): Insight | null {
  const { entries, locale, context, latestEntry } = input;

  const tradeEntries = entries.filter((e) => isPnlKind(e.kind));
  if (tradeEntries.length === 0) return null;

  switch (context) {
    case "after-trade":
      return afterTradeInsight(latestEntry ?? tradeEntries[tradeEntries.length - 1], tradeEntries, locale);
    case "after-loss":
      return afterLossInsight(tradeEntries, locale);
    case "end-of-day":
      return endOfDayInsight(tradeEntries, locale);
    case "end-of-week":
      return endOfWeekInsight(tradeEntries, locale);
    default:
      return null;
  }
}

function afterTradeInsight(
  latest: JournalEntry | undefined,
  all: JournalEntry[],
  locale: NoteLocale
): Insight | null {
  if (!latest) return null;
  const symbol = latest.symbol;
  const side = latest.side;
  const pnl = latest.pnl ?? 0;

  // Count recent trades on same symbol
  const recent = all.filter((e) => e.symbol === symbol).slice(-5);
  const recentLosses = recent.filter((e) => (e.pnl ?? 0) < 0).length;

  if (pnl < 0) {
    if (recentLosses >= 3) {
      return {
        text: t(
          locale,
          `${recentLosses}x rugi di ${symbol}. Pertimbangkan skip ${symbol} besok.`,
          `${recentLosses} losses on ${symbol}. Consider skipping ${symbol} tomorrow.`
        ),
        tone: "warn",
      };
    }
    return {
      text: t(
        locale,
        `Rugi di ${symbol} (${side}). Review setup sebelum lanjut.`,
        `Loss on ${symbol} (${side}). Review setup before continuing.`
      ),
      tone: "down",
    };
  }

  if (pnl > 0) {
    // Check R-multiple if available
    const r = actualRR(latest.entryPrice ?? null, latest.stopLoss ?? null, latest.exitPrice ?? null, latest.side);
    if (r != null && r >= 2) {
      return {
        text: t(
          locale,
          `Win bagus di ${symbol}: ${r.toFixed(1)}R. Pertahankan setup ini.`,
          `Nice win on ${symbol}: ${r.toFixed(1)}R. Keep this setup.`
        ),
        tone: "up",
      };
    }
    return {
      text: t(
        locale,
        `Win di ${symbol} (${side}). Disiplin terjaga.`,
        `Win on ${symbol} (${side}). Discipline held.`
      ),
      tone: "up",
    };
  }

  return null;
}

function afterLossInsight(all: JournalEntry[], locale: NoteLocale): Insight | null {
  const recent = all.slice(-5);
  const losses = recent.filter((e) => (e.pnl ?? 0) < 0);

  if (losses.length >= 3) {
    return {
      text: t(
        locale,
        `${losses.length} rugi beruntun. Saran: jeda 24 jam. Terakhir kali jeda: hasil balik positif.`,
        `${losses.length} losses in a row. Suggest 24h break. Last break: bounced back positive.`
      ),
      tone: "warn",
    };
  }

  if (losses.length === 2) {
    return {
      text: t(
        locale,
        `2 rugi terakhir. Cek: apakah setup sama? Kalau ya, skip sesi ini.`,
        `2 recent losses. Check: same setup? If yes, skip this session.`
      ),
      tone: "warn",
    };
  }

  return null;
}

function endOfDayInsight(all: JournalEntry[], locale: NoteLocale): Insight | null {
  const today = dayKey(new Date().toISOString());
  const todayEntries = all.filter((e) => dayKey(e.openedAt) === today);

  if (todayEntries.length === 0) return null;

  const summary = summarizeJournal(todayEntries);
  const pnl = summary.pnlSum ?? 0;
  const winRate = summary.winRate;

  if (pnl > 0) {
    return {
      text: t(
        locale,
        `Hari hijau. ${formatPnlShort(pnl, locale)}. ${todayEntries.length} trade, ${winRate == null ? "-" : Math.round(winRate * 100)}% win. Disiplin terjaga.`,
        `Green day. ${formatPnlShort(pnl, locale)}. ${todayEntries.length} trades, ${winRate == null ? "-" : Math.round(winRate * 100)}% win. Discipline held.`
      ),
      tone: "up",
    };
  }

  if (pnl < 0) {
    return {
      text: t(
        locale,
        `Hari merah. ${formatPnlShort(pnl, locale)}. ${todayEntries.length} trade. Besok bukan hari untuk balas dendam.`,
        `Red day. ${formatPnlShort(pnl, locale)}. ${todayEntries.length} trades. Tomorrow is not for revenge.`
      ),
      tone: "down",
    };
  }

  return null;
}

function endOfWeekInsight(all: JournalEntry[], locale: NoteLocale): Insight | null {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekMin = dayKey(weekAgo.toISOString());
  const weekEntries = all.filter((e) => dayKey(e.openedAt) >= weekMin);

  if (weekEntries.length === 0) return null;

  const summary = summarizeJournal(weekEntries);
  const pnl = summary.pnlSum ?? 0;
  const wins = summary.wins;
  const losses = summary.losses;

  // Find best and worst trade
  const sorted = [...weekEntries].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (best && worst && best.symbol !== worst.symbol) {
    return {
      text: t(
        locale,
        `Minggu ini: ${formatPnlShort(pnl, locale)}. Terbaik: ${best.symbol} (+${formatPnlShort(best.pnl ?? 0, locale)}). Terburuk: ${worst.symbol} (${formatPnlShort(worst.pnl ?? 0, locale)}).`,
        `This week: ${formatPnlShort(pnl, locale)}. Best: ${best.symbol} (+${formatPnlShort(best.pnl ?? 0, locale)}). Worst: ${worst.symbol} (${formatPnlShort(worst.pnl ?? 0, locale)}).`
      ),
      tone: pnl >= 0 ? "up" : "down",
    };
  }

  return {
    text: t(
      locale,
      `Minggu ini: ${wins}W / ${losses}L. Net ${formatPnlShort(pnl, locale)}.`,
      `This week: ${wins}W / ${losses}L. Net ${formatPnlShort(pnl, locale)}.`
    ),
    tone: pnl >= 0 ? "up" : "down",
  };
}

function formatPnlShort(n: number, locale: NoteLocale): string {
  const sign = n >= 0 ? "+" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(n / 1_000).toFixed(0)}K`;
  return `${sign}${n.toFixed(0)}`;
}
