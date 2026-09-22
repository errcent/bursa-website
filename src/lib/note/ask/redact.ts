/**
 * PII redaction for Ask Your Journal.
 *
 * Notes leave the trust boundary only toward a user-chosen LLM, and only
 * after emails, phones, URLs, and long digit runs are scrubbed. Aggregates
 * (symbol/session/R/outcome) are never redacted — they carry no identity.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /https?:\/\/[^\s)]+/gi;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const LONG_DIGITS_RE = /\b\d{10,}\b/g;

export function redactPII(text: string): string {
  return text
    .replace(EMAIL_RE, "[email]")
    .replace(URL_RE, "[url]")
    .replace(PHONE_RE, "[phone]")
    .replace(LONG_DIGITS_RE, "[number]");
}

/** Truncate to a budget without cutting mid-word when easy. */
export function truncateText(text: string, budget: number): string {
  if (text.length <= budget) return text;
  const slice = text.slice(0, budget);
  const lastSpace = slice.lastIndexOf(" ");
  return `${lastSpace > budget * 0.5 ? slice.slice(0, lastSpace) : slice}…`;
}
