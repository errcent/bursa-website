import type { JournalEntry, JournalKind, JournalResult } from "@/lib/note/types";

export const NOTE_TZ = "Asia/Jakarta";
/** Sunday-first short names. Use weekdayLabels(weekStart) for display order. */
export const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

export type WeekStart = "sunday" | "monday";
export type ColorMode = "hue" | "pattern";
export type LossStyle = "minus" | "paren";

export type FormatPnlOpts = {
  compact?: boolean;
  decimals?: number;
  lossStyle?: LossStyle;
  currency?: "IDR" | "USD" | "USDT";
  /** Calendar/weekday cells: signed number only, no currency label. */
  naked?: boolean;
};

export function weekdayLabels(weekStart: WeekStart = "sunday"): readonly string[] {
  if (weekStart === "monday") {
    return ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  }
  return WEEKDAY_SHORT;
}

export type KindFilter = "ALL" | JournalKind;
export type ResultFilter = "ALL" | JournalResult;

export type DayBucket = {
  date: string;
  pnl: number;
  count: number;
  hasNote: boolean;
};

export type WeekdayNet = {
  weekday: number;
  net: number;
  count: number;
};

export type SliceStat = {
  key: string;
  net: number;
  count: number;
  closed: number;
  wins: number;
  winRate: number | null;
};

export type JournalSnapshot = {
  tradeCount: number;
  closedCount: number;
  pnlSum: number;
  winRate: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  wins: number;
  losses: number;
  be: number;
  open: number;
  byEmotion: { emotion: string; count: number }[];
};

export function dayKey(iso: string, timeZone = NOTE_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function inferJournalResult(
  pnl: number | null | undefined,
  explicit?: JournalResult | null
): JournalResult | null {
  if (explicit) return explicit;
  if (pnl == null) return null;
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "be";
}

export function resolvedResult(entry: Pick<JournalEntry, "pnl" | "result">): JournalResult | null {
  return inferJournalResult(entry.pnl, entry.result);
}

function isClosed(entry: Pick<JournalEntry, "pnl" | "result">): boolean {
  return resolvedResult(entry) !== "open" && entry.pnl != null;
}

export function summarizeJournal(entries: JournalEntry[]): JournalSnapshot {
  const withPnl = entries.filter(isClosed);
  const wins = withPnl.filter((e) => (e.pnl ?? 0) > 0);
  const losses = withPnl.filter((e) => (e.pnl ?? 0) < 0);
  const be = withPnl.filter((e) => (e.pnl ?? 0) === 0);
  const closedNet = withPnl.reduce((s, e) => s + (e.pnl ?? 0), 0);
  const grossWin = wins.reduce((s, e) => s + (e.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, e) => s + (e.pnl ?? 0), 0));
  const emotionMap = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.emotion?.trim();
    if (!key) continue;
    emotionMap.set(key, (emotionMap.get(key) ?? 0) + 1);
  }

  return {
    tradeCount: entries.length,
    closedCount: withPnl.length,
    pnlSum: entries.reduce((s, e) => s + (e.pnl ?? 0), 0),
    winRate: withPnl.length ? wins.length / withPnl.length : null,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Number.POSITIVE_INFINITY : null,
    expectancy: withPnl.length ? closedNet / withPnl.length : null,
    avgWin: wins.length ? grossWin / wins.length : null,
    avgLoss: losses.length ? -(grossLoss / losses.length) : null,
    wins: wins.length,
    losses: losses.length,
    be: be.length,
    open: entries.filter((e) => resolvedResult(e) === "open").length,
    byEmotion: [...emotionMap.entries()]
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function filterEntries(
  entries: JournalEntry[],
  opts: { kind: KindFilter; result: ResultFilter; date?: string | null }
): JournalEntry[] {
  return entries.filter((entry) => {
    if (opts.kind !== "ALL" && entry.kind !== opts.kind) return false;
    if (opts.date && dayKey(entry.openedAt) !== opts.date) return false;
    if (opts.result !== "ALL" && resolvedResult(entry) !== opts.result) return false;
    return true;
  });
}

export function monthBuckets(entries: JournalEntry[], year: number, monthIndex: number): DayBucket[] {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
  const map = new Map<string, DayBucket>();
  for (const entry of entries) {
    const date = dayKey(entry.openedAt);
    if (!date.startsWith(prefix)) continue;
    const current = map.get(date) ?? { date, pnl: 0, count: 0, hasNote: false };
    current.pnl += entry.pnl ?? 0;
    current.count += 1;
    current.hasNote = current.hasNote || Boolean(entry.note?.trim());
    map.set(date, current);
  }
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const date = `${prefix}${String(i + 1).padStart(2, "0")}`;
    return map.get(date) ?? { date, pnl: 0, count: 0, hasNote: false };
  });
}

/** Sunday-first weekday 0–6 for a YYYY-MM-DD calendar date. */
export function sundayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Leading blank cells for a month that starts on `date` (YYYY-MM-DD). */
export function weekPad(date: string, weekStart: WeekStart = "sunday"): number {
  const sun = sundayIndex(date);
  return weekStart === "sunday" ? sun : (sun + 6) % 7;
}

export function weekdayOrder(weekStart: WeekStart = "sunday"): number[] {
  return weekStart === "monday" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
}

export function weekdayNets(entries: JournalEntry[]): WeekdayNet[] {
  const nets: WeekdayNet[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    net: 0,
    count: 0,
  }));
  for (const entry of entries) {
    const i = sundayIndex(dayKey(entry.openedAt));
    nets[i].net += entry.pnl ?? 0;
    nets[i].count += 1;
  }
  return nets;
}

function toSlice(map: Map<string, JournalEntry[]>): SliceStat[] {
  return [...map.entries()]
    .map(([key, rows]) => {
      const closed = rows.filter(isClosed);
      const wins = closed.filter((e) => (e.pnl ?? 0) > 0);
      const net = rows.reduce((s, e) => s + (e.pnl ?? 0), 0);
      return {
        key,
        net,
        count: rows.length,
        closed: closed.length,
        wins: wins.length,
        winRate: closed.length ? wins.length / closed.length : null,
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.count - a.count);
}

export function groupBySymbol(entries: JournalEntry[]): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = entry.symbol.trim() || "—";
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return toSlice(map);
}

export function groupByEmotion(entries: JournalEntry[]): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = entry.emotion?.trim();
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return toSlice(map);
}

function shiftDate(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** Consecutive Jakarta days with ≥1 entry, walking back from today (skip empty today). */
export function loggingStreak(entries: JournalEntry[], nowIso = new Date().toISOString()): number {
  const days = new Set(entries.map((e) => dayKey(e.openedAt)));
  let cursor = dayKey(nowIso);
  if (!days.has(cursor)) cursor = shiftDate(cursor, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function cumulativePnl(entries: JournalEntry[]): number[] {
  const chronological = [...entries].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  let run = 0;
  return chronological.map((e) => {
    run += e.pnl ?? 0;
    return run;
  });
}

export function latestActivityIso(entries: JournalEntry[]): string | null {
  let max: string | null = null;
  for (const entry of entries) {
    const t = entry.createdAt > entry.openedAt ? entry.createdAt : entry.openedAt;
    if (!max || t > max) max = t;
  }
  return max;
}

export function formatNoteTimestamp(iso: string, nowIso = new Date().toISOString()) {
  const absolute = new Intl.DateTimeFormat("id-ID", {
    timeZone: NOTE_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  const sec = Math.max(0, Math.round((new Date(nowIso).getTime() - new Date(iso).getTime()) / 1000));
  let relative = "baru saja";
  if (sec >= 45 && sec < 3600) relative = `${Math.round(sec / 60)} menit lalu`;
  else if (sec >= 3600 && sec < 86400) relative = `${Math.round(sec / 3600)} jam lalu`;
  else if (sec >= 86400) relative = `${Math.round(sec / 86400)} hari lalu`;
  return { relative, absolute: `${absolute} WIB` };
}

function compactBody(abs: number, maxFraction: number): string {
  if (abs < 1000) {
    return abs.toLocaleString("id-ID", { maximumFractionDigits: maxFraction });
  }
  if (abs < 1_000_000) {
    return `${(abs / 1000).toLocaleString("id-ID", { maximumFractionDigits: Math.min(maxFraction || 1, 1) })} rb`;
  }
  return `${(abs / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: Math.min(maxFraction || 1, 1) })} jt`;
}

export function formatPnl(value: number | null | undefined, opts?: FormatPnlOpts) {
  if (value == null) return "—";
  const maxFraction = opts?.decimals ?? (Number.isInteger(value) ? 0 : 2);
  const abs = Math.abs(value);
  const body = opts?.compact
    ? compactBody(abs, maxFraction)
    : abs.toLocaleString("id-ID", { maximumFractionDigits: maxFraction });
  const currency = opts?.naked ? null : (opts?.currency ?? "IDR");
  const prefix = currency === "USD" ? "$" : currency === "IDR" ? "Rp" : "";
  const suffix = currency === "USDT" ? " USDT" : "";
  const labeled = `${prefix}${body}${suffix}`;
  if (value < 0) return opts?.lossStyle === "paren" ? `(${labeled})` : `-${labeled}`;
  if (value > 0) return `+${labeled}`;
  return labeled;
}

export function formatPct(value: number | null) {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatFactor(value: number | null) {
  if (value == null) return "—";
  if (!Number.isFinite(value)) return "∞";
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export function pnlTone(value: number, colorMode: ColorMode = "hue") {
  if (colorMode === "pattern") {
    if (value < 0) return "text-zinc-200 underline decoration-zinc-500 decoration-2 underline-offset-2";
    if (value > 0) return "text-zinc-100";
    return "text-zinc-500";
  }
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-zinc-400";
}
