import { NOTE_TZ } from "@/lib/note/stats";

/** Parse DD/MM/YY + hour 1-12 + AM/PM → ISO in Jakarta. */
export function parseTrackDateTime(
  dateDdMmYy: string,
  hour12: number,
  ampm: "AM" | "PM"
): string | null {
  const m = dateDdMmYy.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour12 < 1 || hour12 > 12) return null;
  let hour24 = hour12 % 12;
  if (ampm === "PM") hour24 += 12;
  const isoLocal = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour24).padStart(2, "0")}:00:00+07:00`;
  const t = Date.parse(isoLocal);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export function formatTrackDateTime(iso: string, locale: "id" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    timeZone: NOTE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function todayDdMmYy(): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: NOTE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  return fmt.format(new Date());
}
