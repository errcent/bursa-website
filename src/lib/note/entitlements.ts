import type { JournalEntry, JournalMode } from "@/lib/note/types";

/** Habit-first: no paid locks. Plus billing is rejected until users are attached. */
export const NOTE_GATES_OPEN = true;

export function utcWeekKey(iso: string): string {
  const date = new Date(iso);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function countReviewsInWeek(entries: JournalEntry[], nowIso = new Date().toISOString()): number {
  const week = utcWeekKey(nowIso);
  return entries.filter((e) => e.mode === "review" && utcWeekKey(e.createdAt) === week).length;
}

export function canUseMode(
  _mode: JournalMode,
  _opts?: { plus?: boolean; reviewCountThisWeek?: number; clinicModuleId?: string | null }
): { ok: boolean; reason?: string; upgrade?: boolean } {
  return { ok: true };
}

export function visibleHistorySince(_plus?: boolean, _now?: Date): Date | null {
  return null;
}

export function filterEntriesForTier(entries: JournalEntry[], _plus?: boolean, _now?: Date): JournalEntry[] {
  return entries;
}
