/**
 * Canonical http(s) URL for href attributes. Rejects javascript:, data:, and
 * other schemes that CodeQL flags as DOM XSS when interpolated into <a href>.
 */
export function toSafeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
