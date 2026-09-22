/**
 * Session routines + missed-trade log (clean-room).
 *
 * Routines are pre/during/post checklists with weekday schedules.
 * Misses are opportunities NOT taken — stored separately and NEVER
 * included in trading metrics (no symbol in entries, no P&L).
 */

export type RoutinePhase = "pre" | "during" | "post";

export interface RoutineItem {
  id: string;
  label: string;
  phase: RoutinePhase;
  /** 0=Sun..6=Sat. Empty = every day. */
  weekdays: number[];
}

export interface MissedTrade {
  id: string;
  date: string;
  symbol: string;
  direction: "long" | "short" | null;
  reason: string;
  thesis: string | null;
}

export interface RoutinesState {
  items: RoutineItem[];
  /** dateKey -> completed item ids */
  checks: Record<string, string[]>;
  misses: MissedTrade[];
}

export const EMPTY_ROUTINES: RoutinesState = { items: [], checks: {}, misses: [] };
export const ROUTINES_BLOB = "routines";

/** Items scheduled for a given date (weekday filter). */
export function routinesForDate(items: RoutineItem[], dateKey: string): RoutineItem[] {
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  if (Number.isNaN(weekday)) return items;
  return items.filter((item) => item.weekdays.length === 0 || item.weekdays.includes(weekday));
}

/** Completion ratio 0..1 for a date, or null when nothing scheduled. */
export function routineScore(state: RoutinesState, dateKey: string): number | null {
  const scheduled = routinesForDate(state.items, dateKey);
  if (scheduled.length === 0) return null;
  const done = new Set(state.checks[dateKey] ?? []);
  const completed = scheduled.filter((item) => done.has(item.id)).length;
  return completed / scheduled.length;
}
