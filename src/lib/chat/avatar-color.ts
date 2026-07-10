/**
 * Deterministic identity colors for avatar initials (no photo).
 * Same userId/name → same palette index across messages, member list, etc.
 */

/** Readable fills for dark theme; light initials text for contrast. */
export const AVATAR_COLOR_PALETTE = [
  "bg-rose-600 text-rose-50",
  "bg-orange-600 text-orange-50",
  "bg-amber-600 text-amber-50",
  "bg-lime-700 text-lime-50",
  "bg-emerald-600 text-emerald-50",
  "bg-teal-600 text-teal-50",
  "bg-cyan-600 text-cyan-50",
  "bg-sky-600 text-sky-50",
  "bg-blue-600 text-blue-50",
  "bg-indigo-600 text-indigo-50",
  "bg-violet-600 text-violet-50",
  "bg-fuchsia-600 text-fuchsia-50",
  "bg-pink-600 text-pink-50",
  "bg-red-700 text-red-50",
  "bg-green-700 text-green-50",
  "bg-purple-600 text-purple-50",
] as const;

/** FNV-1a 32-bit over UTF-16 code units (stable across sessions). */
export function hashUserKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Prefer stable `userId`; fall back to `name` when id is missing.
 * Returns Tailwind classes for AvatarFallback background + text.
 */
export function getAvatarColorClasses(
  userId?: string | null,
  name?: string | null
): string {
  const key = (userId?.trim() || name?.trim() || "?").toLowerCase();
  const index = hashUserKey(key) % AVATAR_COLOR_PALETTE.length;
  return AVATAR_COLOR_PALETTE[index];
}
