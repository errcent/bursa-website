/** Inclusive YYYY-MM-DD bounds for calendar month (UTC date parts). */
export function monthBoundsUtc(year: number, monthIndex0: number): { from: string; to: string } {
  const from = `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  const to = `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function currentMonthBoundsUtc(now = new Date()): { from: string; to: string; year: number; month: number } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const { from, to } = monthBoundsUtc(year, month);
  return { from, to, year, month };
}

export function datesInRange(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function coverageForRange(
  events: { date: string }[],
  from: string,
  to: string
): { complete: boolean; daysWithEvents: number; daysInRange: number } {
  const daysInRange = datesInRange(from, to).length;
  const withEvent = new Set(events.filter((e) => e.date >= from && e.date <= to).map((e) => e.date));
  return {
    complete: withEvent.size >= daysInRange,
    daysWithEvents: withEvent.size,
    daysInRange,
  };
}

/** Split [from, to] into chunks of at most `maxDays` (for scraper limits). */
export function splitDateRange(from: string, to: string, maxDays: number): { from: string; to: string }[] {
  const days = datesInRange(from, to);
  const chunks: { from: string; to: string }[] = [];
  for (let i = 0; i < days.length; i += maxDays) {
    const slice = days.slice(i, i + maxDays);
    chunks.push({ from: slice[0], to: slice[slice.length - 1] });
  }
  return chunks;
}
