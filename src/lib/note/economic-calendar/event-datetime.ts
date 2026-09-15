/** Forex Factory calendar wall times (XML) are US Eastern. JSON feeds include offsets. */
export const FF_CALENDAR_TZ = "America/New_York";

const AMPM = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
const ALL_DAY = /^(all day|day|tentative|-)$/i;

function parseYmd(date: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** Eastern offset minutes (UTC - local). Default EDT (-240). Override for DST via env. */
function ffTzOffsetMinutes(): number {
  const raw = process.env.NOTE_FF_TZ_OFFSET_MINUTES?.trim();
  if (raw && /^-?\d+$/.test(raw)) return Number(raw);
  return -240;
}

/** Parse FF `8:30am` on YYYY-MM-DD into UTC ISO (approximate Eastern). */
export function startsAtFromDateAndTimeLabel(date: string, timeLabel: string): string | null {
  const label = timeLabel.trim();
  if (!label || ALL_DAY.test(label)) return null;
  const m = AMPM.exec(label);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const pm = m[3].toLowerCase() === "pm";
  if (hour === 12) hour = pm ? 12 : 0;
  else if (pm) hour += 12;

  const ymd = parseYmd(date);
  if (!ymd) return null;
  const offsetMin = ffTzOffsetMinutes();
  const utcMs = Date.UTC(ymd.y, ymd.m - 1, ymd.d, hour, minute) - offsetMin * 60_000;
  return new Date(utcMs).toISOString();
}

export function startsAtFromIsoField(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function eventStartsAtMs(event: { startsAt: string | null; date: string; timeLabel: string }): number | null {
  if (event.startsAt) {
    const ms = Date.parse(event.startsAt);
    if (!Number.isNaN(ms)) return ms;
  }
  const iso = startsAtFromDateAndTimeLabel(event.date, event.timeLabel);
  if (!iso) return null;
  return Date.parse(iso);
}
