/**
 * One-call overview bundle: core + risk + daily + equity curves.
 * Single entry point for dashboards; pure and memoizable.
 */

import { dayKey } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";
import type { FxContext } from "@/lib/note/fx/types";
import { computeCoreMetrics, type CoreMetrics } from "./core";
import { computeRiskMetrics, type RiskMetrics } from "./risk";

export interface DayPoint {
  date: string;
  net: number;
  trades: number;
}

export interface EquityPoint {
  t: string;
  cumulative: number;
}

export interface NoteOverview {
  core: CoreMetrics;
  risk: RiskMetrics;
  days: DayPoint[];
  equity: EquityPoint[];
}

export function computeNoteOverview(entries: JournalEntry[], fx?: FxContext): NoteOverview {
  const core = computeCoreMetrics(entries, fx);
  const risk = computeRiskMetrics(entries);
  const byDay = new Map<string, DayPoint>();
  const ordered = [...entries]
    .filter((e) => isPnlKind(e.kind) && e.pnl != null)
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  for (const entry of ordered) {
    const date = dayKey(entry.openedAt);
    const row = byDay.get(date) ?? { date, net: 0, trades: 0 };
    row.net += entry.pnl ?? 0;
    row.trades += 1;
    byDay.set(date, row);
  }
  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  let run = 0;
  const equity = days.map((day) => {
    run += day.net;
    return { t: day.date, cumulative: run };
  });
  return { core, risk, days, equity };
}
