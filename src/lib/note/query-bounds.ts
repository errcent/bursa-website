import { addDays, jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import { currentMonthBoundsUtc } from "@/lib/note/economic-calendar/month-range";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Max inclusive span for economic calendar API (anti bulk scrape / scraper abuse). */
export const ECON_API_MAX_SPAN_DAYS = 62;

/** How far past/future dates are accepted (Jakarta calendar). */
export const ECON_API_MAX_PAST_DAYS = 400;
export const ECON_API_MAX_FUTURE_DAYS = 120;

export function isIsoDate(value: string | null | undefined): value is string {
  return Boolean(value && ISO_DATE.test(value));
}

function daysBetweenInclusive(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${to}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86400000)) + 1;
}

function clampIsoToWindow(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

/**
 * Normalize and clamp economic calendar `from` / `to` before loading sources.
 * Invalid dates fall back to current UTC month bounds.
 */
export function clampEconCalendarRange(
  from?: string,
  to?: string,
  now = new Date()
): { from: string; to: string; clamped: boolean } {
  const month = currentMonthBoundsUtc(now);
  let f = isIsoDate(from) ? from : month.from;
  let t = isIsoDate(to) ? to : month.to;
  if (f > t) {
    const swap = f;
    f = t;
    t = swap;
  }

  const anchor = jakartaDateKey(now);
  const minAllowed = addDays(anchor, -ECON_API_MAX_PAST_DAYS);
  const maxAllowed = addDays(anchor, ECON_API_MAX_FUTURE_DAYS);
  const f0 = f;
  const t0 = t;
  f = clampIsoToWindow(f, minAllowed, maxAllowed);
  t = clampIsoToWindow(t, minAllowed, maxAllowed);
  if (f > t) t = f;

  let clamped = f !== f0 || t !== t0;
  const span = daysBetweenInclusive(f, t);
  if (span > ECON_API_MAX_SPAN_DAYS) {
    t = addDays(f, ECON_API_MAX_SPAN_DAYS - 1);
    clamped = true;
  }

  return { from: f, to: t, clamped };
}

/** Track market-history: max symbols per request. */
export const MARKET_HISTORY_MAX_SYMBOLS = 8;

/** Track market-history: max inclusive day span. */
export const MARKET_HISTORY_MAX_SPAN_DAYS = 366;

export function clampMarketHistoryQuery(
  from: string,
  to: string,
  symbolCount: number,
  now = new Date()
): { from: string; to: string; ok: true } | { ok: false; reason: string } {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    return { ok: false, reason: "Invalid date format." };
  }
  if (symbolCount < 1 || symbolCount > MARKET_HISTORY_MAX_SYMBOLS) {
    return { ok: false, reason: "Too many symbols." };
  }

  let f = from;
  let t = to;
  if (f > t) {
    const swap = f;
    f = t;
    t = swap;
  }

  if (daysBetweenInclusive(f, t) > MARKET_HISTORY_MAX_SPAN_DAYS) {
    return { ok: false, reason: "Date range too wide." };
  }

  const anchor = jakartaDateKey(now);
  const minAllowed = addDays(anchor, -ECON_API_MAX_PAST_DAYS);
  const maxAllowed = addDays(anchor, 30);
  f = clampIsoToWindow(f, minAllowed, maxAllowed);
  t = clampIsoToWindow(t, minAllowed, maxAllowed);
  if (f > t) t = f;

  return { from: f, to: t, ok: true };
}
