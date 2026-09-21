import { entryPnlInDisplay } from "@/lib/note/fx/journal";
import type { FxContext } from "@/lib/note/fx/types";
import { isPnlKind, type JournalEntry, type JournalKind, type JournalResult } from "@/lib/note/types";

function pnlForAggregate(entry: JournalEntry, fx?: FxContext): number {
  if (!fx) return entry.pnl ?? 0;
  return entryPnlInDisplay(entry, fx.display, fx.rates);
}

export const NOTE_TZ = "Asia/Jakarta";
/** Sunday-first short names (id). Use weekdayLabels(weekStart, locale) for display order. */
export const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

const WEEKDAY_SHORT_EN_SUNDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_SHORT_EN_MONDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WEEKDAY_SHORT_ID_MONDAY = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

export type NoteUiLocale = "id" | "en";
export type WeekStart = "sunday" | "monday";
export type ColorMode = "hue" | "pattern";
export type LossStyle = "minus" | "paren";

export type FormatPnlOpts = {
  compact?: boolean;
  decimals?: number;
  lossStyle?: LossStyle;
  currency?: "IDR" | "USD" | "USDT";
  /** Note UI language: drives compact suffixes (rb/jt/mld vs k/m/b) and digit grouping. */
  locale?: NoteUiLocale;
  /** Calendar/weekday cells: signed number only, no currency label. */
  naked?: boolean;
  /** Cap length of numeric body (unit suffix included), e.g. calendar tiles. */
  maxChars?: number;
};

/** Where a PnL string is shown - drives compact caps (overview calendar, analytics, chart ticks). */
export type PnlDisplaySlot = "default" | "calendar" | "analytics" | "chart";

export function pnlFormatForSlot(base: FormatPnlOpts, slot: PnlDisplaySlot): FormatPnlOpts {
  switch (slot) {
    case "calendar":
      return { ...base, compact: true, naked: true, decimals: 0, maxChars: 6 };
    case "analytics":
      return {
        ...base,
        compact: true,
        decimals: Math.min(base.decimals ?? 1, 1),
        maxChars: 9,
      };
    case "chart":
      return { ...base, compact: true, maxChars: 7 };
    default:
      return base;
  }
}

export function weekdayLabels(
  weekStart: WeekStart = "sunday",
  locale: NoteUiLocale = "id"
): readonly string[] {
  if (locale === "en") {
    return weekStart === "monday" ? WEEKDAY_SHORT_EN_MONDAY : WEEKDAY_SHORT_EN_SUNDAY;
  }
  return weekStart === "monday" ? WEEKDAY_SHORT_ID_MONDAY : WEEKDAY_SHORT;
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
  losses: number;
  be: number;
  winRate: number | null;
};

export type OutcomePercentages = {
  winPct: number;
  lossPct: number;
  bePct: number;
  winRate: number | null;
};

export function outcomePercentages(
  wins: number,
  losses: number,
  be: number,
  includeBe: boolean
): OutcomePercentages {
  if (includeBe) {
    const total = wins + losses + be;
    if (!total) return { winPct: 0, lossPct: 0, bePct: 0, winRate: null };
    return {
      winPct: (wins / total) * 100,
      lossPct: (losses / total) * 100,
      bePct: (be / total) * 100,
      winRate: wins / total,
    };
  }
  const wl = wins + losses;
  if (!wl) return { winPct: 0, lossPct: 0, bePct: 0, winRate: be > 0 ? null : null };
  return {
    winPct: (wins / wl) * 100,
    lossPct: (losses / wl) * 100,
    bePct: 0,
    winRate: wins / wl,
  };
}

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

export function summarizeJournal(entries: JournalEntry[], fx?: FxContext): JournalSnapshot {
  const pnlEntries = entries.filter((e) => isPnlKind(e.kind));
  const withPnl = pnlEntries.filter(isClosed);
  const wins = withPnl.filter((e) => pnlForAggregate(e, fx) > 0);
  const losses = withPnl.filter((e) => pnlForAggregate(e, fx) < 0);
  const be = withPnl.filter((e) => pnlForAggregate(e, fx) === 0);
  const closedNet = withPnl.reduce((s, e) => s + pnlForAggregate(e, fx), 0);
  const grossWin = wins.reduce((s, e) => s + pnlForAggregate(e, fx), 0);
  const grossLoss = Math.abs(losses.reduce((s, e) => s + pnlForAggregate(e, fx), 0));
  return {
    tradeCount: entries.length,
    closedCount: withPnl.length,
    pnlSum: pnlEntries.reduce((s, e) => s + pnlForAggregate(e, fx), 0),
    winRate: withPnl.length ? wins.length / withPnl.length : null,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Number.POSITIVE_INFINITY : null,
    expectancy: withPnl.length ? closedNet / withPnl.length : null,
    avgWin: wins.length ? grossWin / wins.length : null,
    avgLoss: losses.length ? -(grossLoss / losses.length) : null,
    wins: wins.length,
    losses: losses.length,
    be: be.length,
    open: pnlEntries.filter((e) => resolvedResult(e) === "open").length,
    byEmotion: [],
  };
}

export type JournalFilterOpts = {
  kind: KindFilter;
  result: ResultFilter;
  date?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  symbol?: string | null;
  side?: string | null;
};

export function filterEntries(entries: JournalEntry[], opts: JournalFilterOpts): JournalEntry[] {
  const sym = opts.symbol?.trim().toUpperCase();
  const side = opts.side?.trim().toUpperCase();
  return entries.filter((entry) => {
    if (opts.kind !== "ALL" && entry.kind !== opts.kind) return false;
    const dk = dayKey(entry.openedAt);
    if (opts.date && dk !== opts.date) return false;
    if (opts.dateFrom && dk < opts.dateFrom) return false;
    if (opts.dateTo && dk > opts.dateTo) return false;
    if (opts.result !== "ALL" && resolvedResult(entry) !== opts.result) return false;
    if (sym && entry.symbol.trim().toUpperCase() !== sym) return false;
    if (side && entry.side.trim().toUpperCase() !== side) return false;
    return true;
  });
}

export function monthBuckets(
  entries: JournalEntry[],
  year: number,
  monthIndex: number,
  fx?: FxContext
): DayBucket[] {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
  const map = new Map<string, DayBucket>();
  for (const entry of entries) {
    const date = dayKey(entry.openedAt);
    if (!date.startsWith(prefix)) continue;
    const current = map.get(date) ?? { date, pnl: 0, count: 0, hasNote: false };
    if (isPnlKind(entry.kind)) {
      current.pnl += pnlForAggregate(entry, fx);
    }
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

/** Sunday-first weekday 0-6 for a YYYY-MM-DD calendar date. */
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

function toSlice(map: Map<string, JournalEntry[]>, fx?: FxContext): SliceStat[] {
  return [...map.entries()]
    .map(([key, rows]) => {
      const closed = rows.filter(isClosed);
      const wins = closed.filter((e) => pnlForAggregate(e, fx) > 0);
      const losses = closed.filter((e) => pnlForAggregate(e, fx) < 0);
      const be = closed.filter((e) => pnlForAggregate(e, fx) === 0);
      const net = rows.reduce((s, e) => s + pnlForAggregate(e, fx), 0);
      return {
        key,
        net,
        count: rows.length,
        closed: closed.length,
        wins: wins.length,
        losses: losses.length,
        be: be.length,
        winRate: closed.length ? wins.length / closed.length : null,
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.count - a.count);
}

export function groupBySymbol(entries: JournalEntry[], fx?: FxContext): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = entry.symbol.trim() || "-";
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return toSlice(map, fx);
}

export function groupByEmotion(entries: JournalEntry[], fx?: FxContext): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = entry.emotion?.trim();
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return toSlice(map, fx);
}

/** Closed trades grouped by Jakarta calendar day (for daily win-rate charts). */
export type SeriesPoint = { date: string; value: number; /** X tick when aligned to stack/scatter */ tickLabel?: string };

/** Y-axis domain tight to data (not forced through zero). */
export function seriesYDomain(values: number[], padRatio = 0.08): [number, number] {
  if (!values.length) return [-1, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const band = Math.max(Math.abs(min), 1) * 0.15;
    return [min - band, max + band];
  }
  const span = max - min;
  const pad = span * padRatio;
  return [min - pad, max + pad];
}

/** Cumulative journal P/L (equity curve of closed trades), Jakarta days. */
export function journalEquityCurve(
  entries: JournalEntry[],
  opts: { from: string; to: string; fx?: FxContext }
): SeriesPoint[] {
  const closed = entries
    .filter((e) => isPnlKind(e.kind) && isClosed(e))
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  const daily = new Map<string, number>();
  for (const entry of closed) {
    const d = dayKey(entry.openedAt);
    daily.set(d, (daily.get(d) ?? 0) + pnlForAggregate(entry, opts.fx));
  }

  let run = 0;
  for (const entry of closed) {
    const d = dayKey(entry.openedAt);
    if (d >= opts.from) break;
    run += pnlForAggregate(entry, opts.fx);
  }

  const out: SeriesPoint[] = [];
  let hadActivity = false;
  for (let cursor = opts.from; cursor <= opts.to; cursor = shiftDate(cursor, 1)) {
    if (daily.has(cursor)) hadActivity = true;
    run += daily.get(cursor) ?? 0;
    out.push({ date: cursor, value: Math.round(run * 100) / 100 });
  }

  if (!hadActivity && run === 0) return [];
  return out;
}

function baselinePnlBeforeRange(
  entries: JournalEntry[],
  from: string,
  fx?: FxContext
): number {
  const closed = entries
    .filter((e) => isPnlKind(e.kind) && isClosed(e))
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  let run = 0;
  for (const entry of closed) {
    const d = dayKey(entry.openedAt);
    if (d >= from) break;
    run += pnlForAggregate(entry, fx);
  }
  return run;
}

/** Cumulative P/L with the same buckets/labels as `pnlStackPoints` (day | month | trade). */
export function alignedCumulativeSeries(
  entries: JournalEntry[],
  opts: {
    granularity: PnlStackGranularity;
    from: string;
    to: string;
    hideEmptyDays?: boolean;
    maxTradePoints?: number;
    fx?: FxContext;
  }
): SeriesPoint[] {
  const stack = pnlStackPoints(entries, opts);
  if (!stack.length) return [];
  let run = baselinePnlBeforeRange(entries, opts.from, opts.fx);
  return stack.map((row) => {
    run += row.net;
    return {
      date: row.label,
      tickLabel: row.label,
      value: Math.round(run * 100) / 100,
    };
  });
}

/** Closed trades grouped by weekday (0=Sun … 6=Sat, Jakarta date). */
export function groupByWeekday(
  entries: JournalEntry[],
  opts?: { from?: string; to?: string; fx?: FxContext; weekStart?: WeekStart }
): SliceStat[] {
  const buckets: JournalEntry[][] = Array.from({ length: 7 }, () => []);
  for (const entry of entries) {
    if (!isClosed(entry)) continue;
    const dk = dayKey(entry.openedAt);
    if (opts?.from && dk < opts.from) continue;
    if (opts?.to && dk > opts.to) continue;
    buckets[sundayIndex(dk)]!.push(entry);
  }

  const slices = buckets.map((rows, i) => {
    if (!rows.length) {
      return {
        key: String(i),
        net: 0,
        count: 0,
        closed: 0,
        wins: 0,
        losses: 0,
        be: 0,
        winRate: null,
      };
    }
    return toSlice(new Map([[String(i), rows]]), opts?.fx)[0]!;
  });

  const order = weekdayOrder(opts?.weekStart ?? "sunday");
  return order.map((i) => slices[i]!);
}

export type WinRatePoint = {
  date: string;
  label: string;
  winRatePct: number | null;
  closed: number;
};

function roundPctStat(n: number) {
  return Math.round(n * 10) / 10;
}

function outcomeCounts(entry: JournalEntry, fx?: FxContext) {
  const pnl = pnlForAggregate(entry, fx);
  if (pnl > 0) return { wins: 1, losses: 0, be: 0 };
  if (pnl < 0) return { wins: 0, losses: 1, be: 0 };
  return { wins: 0, losses: 0, be: 1 };
}

/** Rolling win rate after each close (dynamic WR curve). */
export function rollingWinRateSeries(
  entries: JournalEntry[],
  opts: {
    windowSize: number;
    includeBe: boolean;
    maxPoints?: number;
    fx?: FxContext;
  }
): WinRatePoint[] {
  const closed = entries
    .filter((e) => isPnlKind(e.kind) && isClosed(e))
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  const w = Math.max(2, opts.windowSize);
  const points: WinRatePoint[] = [];

  for (let i = w - 1; i < closed.length; i++) {
    const window = closed.slice(i - w + 1, i + 1);
    let wins = 0;
    let losses = 0;
    let be = 0;
    for (const entry of window) {
      const c = outcomeCounts(entry, opts.fx);
      wins += c.wins;
      losses += c.losses;
      be += c.be;
    }
    const mix = outcomePercentages(wins, losses, be, opts.includeBe);
    const anchor = closed[i]!;
    const dk = dayKey(anchor.openedAt);
    const [, m, d] = dk.split("-");
    points.push({
      date: dk,
      label: `${Number(m)}/${Number(d)}`,
      winRatePct: mix.winRate != null ? roundPctStat(mix.winRate * 100) : null,
      closed: window.length,
    });
  }

  const cap = opts.maxPoints ?? 90;
  return points.length > cap ? points.slice(-cap) : points;
}

export function groupByDay(
  entries: JournalEntry[],
  opts?: { from?: string; to?: string; fx?: FxContext }
): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    if (!isClosed(entry)) continue;
    const key = dayKey(entry.openedAt);
    if (opts?.from && key < opts.from) continue;
    if (opts?.to && key > opts.to) continue;
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return toSlice(map, opts?.fx).sort((a, b) => a.key.localeCompare(b.key));
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
  const chronological = [...entries]
    .filter((e) => isPnlKind(e.kind))
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));
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

export function formatNoteTimestamp(
  iso: string,
  nowIso = new Date().toISOString(),
  locale: NoteUiLocale = "id"
) {
  const intlLocale = locale === "en" ? "en-US" : "id-ID";
  const absolute = new Intl.DateTimeFormat(intlLocale, {
    timeZone: NOTE_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  const sec = Math.max(0, Math.round((new Date(nowIso).getTime() - new Date(iso).getTime()) / 1000));
  let relative: string;
  if (locale === "en") {
    relative = "just now";
    if (sec >= 45 && sec < 3600) relative = `${Math.round(sec / 60)} min ago`;
    else if (sec >= 3600 && sec < 86400) relative = `${Math.round(sec / 3600)} hr ago`;
    else if (sec >= 86400) relative = `${Math.round(sec / 86400)} days ago`;
  } else {
    relative = "baru saja";
    if (sec >= 45 && sec < 3600) relative = `${Math.round(sec / 60)} menit lalu`;
    else if (sec >= 3600 && sec < 86400) relative = `${Math.round(sec / 3600)} jam lalu`;
    else if (sec >= 86400) relative = `${Math.round(sec / 86400)} hari lalu`;
  }
  return { relative, absolute: `${absolute} WIB` };
}

/** Compact magnitude suffixes: ID (rb/jt/mld/trl) vs EN (k/m/b/t). */
const COMPACT_SCALE = {
  id: {
    intl: "id-ID",
    thousand: "rb",
    million: "jt",
    billion: "mld",
    trillion: "trl",
    spacedSuffix: true,
  },
  en: {
    intl: "en-US",
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t",
    spacedSuffix: false,
  },
} as const;

function noteIntlLocale(locale: NoteUiLocale): string {
  return COMPACT_SCALE[locale].intl;
}

function withCompactSuffix(numPart: string, suffix: string, locale: NoteUiLocale): string {
  return COMPACT_SCALE[locale].spacedSuffix ? `${numPart} ${suffix}` : `${numPart}${suffix}`;
}

function compactBody(abs: number, maxFraction: number, locale: NoteUiLocale): string {
  const intl = noteIntlLocale(locale);
  const scale = COMPACT_SCALE[locale];
  const fracCap = (n: number) => Math.min(maxFraction || 1, n);
  if (abs < 1000) {
    return abs.toLocaleString(intl, { maximumFractionDigits: maxFraction });
  }
  if (abs < 1_000_000) {
    const num = (abs / 1000).toLocaleString(intl, { maximumFractionDigits: fracCap(1) });
    return withCompactSuffix(num, scale.thousand, locale);
  }
  if (abs < 1_000_000_000) {
    const num = (abs / 1_000_000).toLocaleString(intl, { maximumFractionDigits: fracCap(1) });
    return withCompactSuffix(num, scale.million, locale);
  }
  if (abs < 1_000_000_000_000) {
    const num = (abs / 1_000_000_000).toLocaleString(intl, { maximumFractionDigits: fracCap(1) });
    return withCompactSuffix(num, scale.billion, locale);
  }
  const num = (abs / 1_000_000_000_000).toLocaleString(intl, { maximumFractionDigits: fracCap(1) });
  return withCompactSuffix(num, scale.trillion, locale);
}

function compactBodyCapped(abs: number, maxChars: number, preferredFraction: number, locale: NoteUiLocale): string {
  const scale = COMPACT_SCALE[locale];
  const tryFrac = (frac: number) => compactBody(abs, frac, locale).replace(/\s/g, "");
  for (const frac of [preferredFraction, 0]) {
    const s = tryFrac(frac);
    if (s.length <= maxChars) return s;
  }
  if (abs >= 1_000_000_000_000) {
    const n = Math.round(abs / 1_000_000_000_000);
    return `${n}${scale.trillion}`.slice(0, maxChars);
  }
  if (abs >= 1_000_000_000) {
    const n = Math.round(abs / 1_000_000_000);
    return `${n}${scale.billion}`.slice(0, maxChars);
  }
  if (abs >= 1_000_000) {
    const n = Math.round(abs / 1_000_000);
    return `${n}${scale.million}`.slice(0, maxChars);
  }
  if (abs >= 1000) {
    const n = Math.round(abs / 1000);
    return `${n}${scale.thousand}`.slice(0, maxChars);
  }
  return String(Math.round(abs)).slice(0, maxChars);
}

export function formatPnl(value: number | null | undefined, opts?: FormatPnlOpts) {
  if (value == null) return "-";
  const locale = opts?.locale ?? "id";
  const maxFraction = opts?.decimals ?? (Number.isInteger(value) ? 0 : 2);
  const abs = Math.abs(value);
  let body: string;
  if (opts?.maxChars != null && opts.maxChars > 0) {
    body = compactBodyCapped(abs, opts.maxChars, maxFraction, locale);
  } else if (opts?.compact) {
    body = compactBody(abs, maxFraction, locale);
  } else {
    body = abs.toLocaleString(noteIntlLocale(locale), { maximumFractionDigits: maxFraction });
  }
  const currency = opts?.naked ? null : (opts?.currency ?? "IDR");
  const prefix = currency === "USD" ? "$" : currency === "IDR" ? "Rp" : "";
  const suffix = currency === "USDT" ? " USDT" : "";
  const labeled = `${prefix}${body}${suffix}`;
  if (value < 0) return opts?.lossStyle === "paren" ? `(${labeled})` : `-${labeled}`;
  if (value > 0) return `+${labeled}`;
  return labeled;
}

export function formatPct(value: number | null) {
  if (value == null) return "-";
  return `${Math.round(value * 100)}%`;
}

export function formatFactor(value: number | null, locale: NoteUiLocale = "id") {
  if (value == null) return "-";
  if (!Number.isFinite(value)) return "∞";
  return value.toLocaleString(noteIntlLocale(locale), { maximumFractionDigits: 2 });
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

export const MONTHLY_RETURN_NOTIONAL_IDR = 10_000_000;

export function returnsNotionalFromEntries(entries: JournalEntry[], override?: number): number {
  const pnlEntries = entries.filter((e) => isPnlKind(e.kind));
  const byDay = new Map<string, number>();
  for (const entry of pnlEntries) {
    const d = dayKey(entry.openedAt);
    byDay.set(d, (byDay.get(d) ?? 0) + (entry.pnl ?? 0));
  }
  const peakAbs = Math.max(0, ...byDay.values().map((v) => Math.abs(v)));
  return override ?? Math.max(MONTHLY_RETURN_NOTIONAL_IDR, peakAbs, 1);
}

export function dailyReturnPct(pnl: number, notional: number): number {
  return Math.round((pnl / notional) * 1000) / 10;
}

export type MonthlyReturnsGrid = {
  years: number[];
  returns: number[][];
  notional: number;
};

export function monthlyReturnsGrid(
  entries: JournalEntry[],
  opts?: { notional?: number; spanYears?: number; anchorYear?: number }
): MonthlyReturnsGrid {
  const anchorYear = opts?.anchorYear ?? new Date().getFullYear();
  const span = opts?.spanYears ?? 3;
  const years = Array.from({ length: span }, (_, i) => anchorYear - span + 1 + i);
  const monthly = new Map<string, number>();
  for (const entry of entries) {
    if (!isPnlKind(entry.kind)) continue;
    const dk = dayKey(entry.openedAt);
    const key = dk.slice(0, 7);
    monthly.set(key, (monthly.get(key) ?? 0) + (entry.pnl ?? 0));
  }
  const peakAbs = Math.max(0, ...monthly.values().map((v) => Math.abs(v)));
  const notional = opts?.notional ?? Math.max(MONTHLY_RETURN_NOTIONAL_IDR, peakAbs, 1);
  const returns = years.map((y) =>
    Array.from({ length: 12 }, (_, m) => {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const pnl = monthly.get(key) ?? 0;
      return Math.round((pnl / notional) * 1000) / 10;
    })
  );
  return { years, returns, notional };
}

export type PnlStackGranularity = "day" | "month" | "trade";

export type PnlStackPoint = {
  label: string;
  wins: number;
  losses: number;
  net: number;
};

function dateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function addPnlToBucket(bucket: { wins: number; losses: number }, pnl: number) {
  if (pnl > 0) bucket.wins += pnl;
  else if (pnl < 0) bucket.losses += Math.abs(pnl);
}

function roundStackPoint(label: string, bucket: { wins: number; losses: number }): PnlStackPoint {
  const wins = Math.round(bucket.wins);
  const losses = Math.round(bucket.losses);
  return { label, wins, losses, net: wins - losses };
}

export function pnlStackPoints(
  entries: JournalEntry[],
  opts: {
    granularity: PnlStackGranularity;
    from: string;
    to: string;
    hideEmptyDays?: boolean;
    maxTradePoints?: number;
    fx?: FxContext;
  }
): PnlStackPoint[] {
  const pnlEntries = entries
    .filter((e) => isPnlKind(e.kind) && isClosed(e))
    .filter((e) => dateInRange(dayKey(e.openedAt), opts.from, opts.to))
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  if (opts.granularity === "trade") {
    const cap = opts.maxTradePoints ?? 80;
    const slice = pnlEntries.length > cap ? pnlEntries.slice(-cap) : pnlEntries;
    return slice.map((entry, i) => {
      const pnl = pnlForAggregate(entry, opts.fx);
      // Axis ticks stay minimal (index only). Symbol lives in tooltip via label if needed later.
      const label = String(i + 1);
      const bucket = { wins: 0, losses: 0 };
      addPnlToBucket(bucket, pnl);
      return roundStackPoint(label, bucket);
    });
  }

  if (opts.granularity === "day") {
    const byDay = new Map<string, { wins: number; losses: number }>();
    for (const entry of pnlEntries) {
      const dk = dayKey(entry.openedAt);
      const bucket = byDay.get(dk) ?? { wins: 0, losses: 0 };
      addPnlToBucket(bucket, pnlForAggregate(entry, opts.fx));
      byDay.set(dk, bucket);
    }
    const days: string[] = [];
    for (let cursor = opts.from; cursor <= opts.to; cursor = shiftDate(cursor, 1)) {
      if (opts.hideEmptyDays && !byDay.has(cursor)) continue;
      days.push(cursor);
    }
    return days.map((dk) => {
      const bucket = byDay.get(dk) ?? { wins: 0, losses: 0 };
      const [, m, d] = dk.split("-");
      return roundStackPoint(`${Number(m)}/${Number(d)}`, bucket);
    });
  }

  const byMonth = new Map<string, { wins: number; losses: number }>();
  for (const entry of pnlEntries) {
    const ym = dayKey(entry.openedAt).slice(0, 7);
    const bucket = byMonth.get(ym) ?? { wins: 0, losses: 0 };
    addPnlToBucket(bucket, pnlForAggregate(entry, opts.fx));
    byMonth.set(ym, bucket);
  }
  const months: string[] = [];
  const [y0, m0] = opts.from.split("-").map(Number);
  const [y1, m1] = opts.to.split("-").map(Number);
  let y = y0;
  let m = m0;
  while (y < y1 || (y === y1 && m <= m1)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months.map((ym) => {
    const bucket = byMonth.get(ym) ?? { wins: 0, losses: 0 };
    const [, mm] = ym.split("-");
    const monthIdx = Number(mm) - 1;
    return roundStackPoint(MONTH_SHORT_EN[monthIdx] ?? ym, bucket);
  });
}

export const MONTH_SHORT_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type MonthlyPnlStackPoint = PnlStackPoint & { month: string };

export function monthlyPnlStackPoints(entries: JournalEntry[], year: number): MonthlyPnlStackPoint[] {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const points = pnlStackPoints(entries, { granularity: "month", from, to });
  return points.map((p, i) => ({
    ...p,
    month: MONTH_SHORT_EN[i] ?? String(i + 1),
  }));
}
