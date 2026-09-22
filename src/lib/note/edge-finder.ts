/**
 * Edge finder (v3 P1).
 *
 * Anti-600-metrics: ONE sentence with a concrete action.
 *
 * After 20+ trades, auto-generate:
 * "Your edge is Asian session EURUSD (67% win).
 *  Your leak is NY session XAUUSD (73% loss).
 *  Fix: skip NY XAUUSD."
 *
 * Derives session from entry time (auto, not a form field).
 */

import type { JournalEntry } from "@/lib/note/types";
import { isPnlKind } from "@/lib/note/types";
import type { NoteLocale } from "@/lib/note/prefs";

export interface EdgeFinding {
  edgeSymbol: string;
  edgeSession: string;
  edgeWinRate: number;
  edgeCount: number;
  leakSymbol: string;
  leakSession: string;
  leakWinRate: number;
  leakCount: number;
}

export interface EdgeInsight {
  text: string;
  tone: "up" | "down" | "neutral";
  finding: EdgeFinding | null;
}

const t = (locale: NoteLocale, id: string, en: string) => (locale === "en" ? en : id);

/** Derive trading session from entry time (UTC). */
export function deriveSession(openedAt: string): string {
  try {
    const d = new Date(openedAt);
    const h = d.getUTCHours();
    // Asian: 00:00-08:00 UTC (07:00-15:00 WIB)
    if (h >= 0 && h < 8) return "asian";
    // London: 08:00-16:00 UTC (15:00-23:00 WIB)
    if (h >= 8 && h < 16) return "london";
    // NY: 16:00-24:00 UTC (23:00-07:00 WIB next day)
    return "ny";
  } catch {
    return "unknown";
  }
}

interface SessionStat {
  symbol: string;
  session: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

function computeSessionStats(entries: JournalEntry[]): SessionStat[] {
  const map = new Map<string, SessionStat>();

  for (const e of entries) {
    if (!isPnlKind(e.kind) || e.pnl == null) continue;
    const session = deriveSession(e.openedAt);
    const key = `${e.symbol}::${session}`;
    let stat = map.get(key);
    if (!stat) {
      stat = { symbol: e.symbol, session, wins: 0, losses: 0, total: 0, winRate: 0 };
      map.set(key, stat);
    }
    stat.total++;
    if (e.pnl > 0) stat.wins++;
    else if (e.pnl < 0) stat.losses++;
  }

  for (const s of map.values()) {
    s.winRate = s.total > 0 ? s.wins / s.total : 0;
  }

  return [...map.values()];
}

/**
 * Find the strongest edge and biggest leak.
 * Requires at least 20 trades with PnL to generate a finding.
 */
export function findEdge(entries: JournalEntry[]): EdgeFinding | null {
  const tradeEntries = entries.filter((e) => isPnlKind(e.kind) && e.pnl != null);
  if (tradeEntries.length < 20) return null;

  const stats = computeSessionStats(tradeEntries);
  // Only consider session+symbol combos with at least 3 trades
  const significant = stats.filter((s) => s.total >= 3);
  if (significant.length === 0) return null;

  // Edge: highest win rate with most trades
  const sortedByEdge = [...significant].sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.total - a.total;
  });
  const edge = sortedByEdge[0];

  // Leak: lowest win rate with most losses
  const sortedByLeak = [...significant].sort((a, b) => {
    if (a.winRate !== b.winRate) return a.winRate - b.winRate;
    return b.losses - a.losses;
  });
  const leak = sortedByLeak[0];

  if (!edge || !leak) return null;
  // Only report if there's a meaningful spread
  if (edge.winRate < 0.55) return null;
  if (leak.winRate > 0.45) return null;

  return {
    edgeSymbol: edge.symbol,
    edgeSession: edge.session,
    edgeWinRate: edge.winRate,
    edgeCount: edge.total,
    leakSymbol: leak.symbol,
    leakSession: leak.session,
    leakWinRate: leak.winRate,
    leakCount: leak.total,
  };
}

/**
 * Generate one-line edge insight.
 */
export function generateEdgeInsight(entries: JournalEntry[], locale: NoteLocale): EdgeInsight | null {
  const finding = findEdge(entries);
  if (!finding) return null;

  const edgePct = Math.round(finding.edgeWinRate * 100);
  const leakPct = Math.round(finding.leakWinRate * 100);

  const text = t(
    locale,
    `Edge kamu: ${finding.edgeSession} ${finding.edgeSymbol} (${edgePct}% win). Bocor: ${finding.leakSession} ${finding.leakSymbol} (${leakPct}% loss). Fix: skip ${finding.leakSession} ${finding.leakSymbol}.`,
    `Your edge: ${finding.edgeSession} ${finding.edgeSymbol} (${edgePct}% win). Leak: ${finding.leakSession} ${finding.leakSymbol} (${leakPct}% loss). Fix: skip ${finding.leakSession} ${finding.leakSymbol}.`
  );

  return {
    text,
    tone: "neutral",
    finding,
  };
}
