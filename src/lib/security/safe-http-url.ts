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

const COURSE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** Validates catalog course slugs before they are used in href path segments. */
export function toSafeCourseSlug(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) return null;
  if (!COURSE_SLUG_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/** Safe /kelas/[slug] href for user- or server-provided slugs. */
export function courseClassHref(catalogBase: string, slug: string): string | null {
  const safeSlug = toSafeCourseSlug(slug);
  if (!safeSlug) return null;
  const path = `/kelas/${encodeURIComponent(safeSlug)}`;
  const base = catalogBase.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}
