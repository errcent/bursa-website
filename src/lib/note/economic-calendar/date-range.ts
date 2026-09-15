import { NOTE_TZ } from "@/lib/note/stats";

import { clientMonthBounds } from "@/lib/note/economic-calendar/client-month";

export type EconDatePreset = "today" | "this_week" | "next_week" | "this_month" | "next_month" | "custom";

export type EconDateRange = {
  preset: EconDatePreset;
  from: string;
  to: string;
};

const STORAGE_KEY = "note-econ-date-range-v1";

/** YYYY-MM-DD in Note timezone (Asia/Jakarta). */
export function jakartaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NOTE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** True when `from` and `to` fall in the same YYYY-MM (Jakarta calendar dates). */
export function rangeWithinSingleCalendarMonth(range: Pick<EconDateRange, "from" | "to">): boolean {
  return range.from.slice(0, 7) === range.to.slice(0, 7);
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function sundayWeekStart(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay();
  return addDays(iso, -day);
}

export function rangeForPreset(preset: EconDatePreset, anchor = jakartaDateKey()): EconDateRange {
  if (preset === "today") {
    return { preset, from: anchor, to: anchor };
  }
  if (preset === "this_week") {
    const from = sundayWeekStart(anchor);
    const to = addDays(from, 6);
    return { preset, from, to };
  }
  if (preset === "next_week") {
    const from = addDays(sundayWeekStart(anchor), 7);
    const to = addDays(from, 6);
    return { preset, from, to };
  }
  if (preset === "this_month") {
    const { from, to } = clientMonthBounds(new Date(`${anchor}T12:00:00+07:00`));
    return { preset, from, to };
  }
  if (preset === "next_month") {
    const [y, m] = anchor.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const { from, to } = clientMonthBounds(new Date(`${next}T12:00:00+07:00`));
    return { preset, from, to };
  }
  return { preset: "custom", from: anchor, to: anchor };
}

export function defaultEconDateRange(): EconDateRange {
  return rangeForPreset("today");
}

export function loadEconDateRange(): EconDateRange {
  if (typeof window === "undefined") return defaultEconDateRange();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultEconDateRange();
    const parsed = JSON.parse(raw) as Partial<EconDateRange>;
    if (!parsed.from || !parsed.to) return defaultEconDateRange();
    return {
      preset: parsed.preset ?? "custom",
      from: parsed.from,
      to: parsed.to,
    };
  } catch {
    return defaultEconDateRange();
  }
}

export function saveEconDateRange(range: EconDateRange) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
}

/** Widen to full month(s) for API/scrape cache, then filter in UI. */
export function apiEnvelopeForRange(range: EconDateRange): { from: string; to: string } {
  const [yf, mf] = range.from.split("-").map(Number);
  const [yt, mt] = range.to.split("-").map(Number);
  const from = `${yf}-${String(mf).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(yt, mt, 0)).getUTCDate();
  const to = `${yt}-${String(mt).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function eventInRange(eventDate: string, range: EconDateRange): boolean {
  return eventDate >= range.from && eventDate <= range.to;
}

export function formatRangeLabel(range: EconDateRange, locale: "id" | "en"): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };
  if (range.from === range.to) {
    const today = jakartaDateKey();
    if (range.from === today) {
      return locale === "en" ? `Today: ${fmt(range.from)}` : `Hari ini: ${fmt(range.from)}`;
    }
    return fmt(range.from);
  }
  return `${fmt(range.from)} – ${fmt(range.to)}`;
}
