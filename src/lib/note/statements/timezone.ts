/**
 * Statement timezone interpretation (clean-room).
 *
 * Broker exports usually carry wall-clock times without offsets. Those are
 * interpreted in the statement's IANA timezone and converted to UTC ISO.
 * Values already carrying an offset or Z pass through untouched.
 * DST boundaries resolve via a two-pass Intl wall-clock correction.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

const TWO_DIGIT: ReadonlyArray<"hour" | "minute" | "second" | "day" | "month"> = [
  "hour",
  "minute",
  "second",
  "day",
  "month",
];

function formatterFor(tz: string): Intl.DateTimeFormat {
  const cached = formatters.get(tz);
  if (cached) return cached;
  const fields = Object.fromEntries(TWO_DIGIT.map((f) => [f, "2-digit"])) as Record<
    (typeof TWO_DIGIT)[number],
    "2-digit"
  >;
  const created = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    ...fields,
  });
  formatters.set(tz, created);
  return created;
}

export function isValidTimezone(tz: string): boolean {
  try {
    formatterFor(tz);
    return true;
  } catch {
    return false;
  }
}

function wallAsUtc(utcMs: number, tz: string): number {
  const seen: Record<string, number> = {};
  for (const part of formatterFor(tz).formatToParts(new Date(utcMs))) {
    if (part.type !== "literal") seen[part.type] = Number(part.value);
  }
  const midnight = seen["hour"] === 24 ? 0 : (seen["hour"] ?? 0);
  return Date.UTC(
    seen["year"] ?? 1970,
    (seen["month"] ?? 1) - 1,
    seen["day"] ?? 1,
    midnight,
    seen["minute"] ?? 0,
    seen["second"] ?? 0,
  );
}

const NAIVE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

function parseAbsolute(text: string): string | null {
  const epoch = Date.parse(text);
  if (Number.isNaN(epoch)) return null;
  return new Date(epoch).toISOString();
}

/**
 * Interpret a date string in `tz`, returning UTC ISO.
 * Returns null when unparseable. Offset-bearing inputs keep their instant.
 */
export function interpretInTz(value: string, tz: string): string | null {
  const text = value.trim();
  if (!text) return null;
  if (HAS_OFFSET.test(text)) return parseAbsolute(text);
  const m = text.match(NAIVE_RE);
  if (!m) return parseAbsolute(text);
  const naiveMs = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  if (Number.isNaN(naiveMs)) return null;
  if (tz === "UTC") return new Date(naiveMs).toISOString();
  if (!isValidTimezone(tz)) return new Date(naiveMs).toISOString();
  let guess = naiveMs - (wallAsUtc(naiveMs, tz) - naiveMs);
  guess = naiveMs - (wallAsUtc(guess, tz) - guess);
  return new Date(guess).toISOString();
}
