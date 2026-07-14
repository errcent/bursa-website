/**
 * Komunitas (chat/community) feature flag.
 * Disabled by default — set NEXT_PUBLIC_KOMUNITAS_ENABLED=true to restore.
 */

export const KOMUNITAS_ENABLED =
  process.env.NEXT_PUBLIC_KOMUNITAS_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_KOMUNITAS_ENABLED === "1";

/** API route prefixes blocked when komunitas is disabled. */
export const KOMUNITAS_API_PREFIXES = [
  "/api/chat",
  "/api/trading",
  "/api/admin/chat-rooms",
  "/api/admin/collaboration-chat",
  "/api/admin/branch-change-requests",
  "/api/mentor/collaboration-chat",
  "/api/mentor/chat-rooms",
  "/api/mentor/branch-change-requests",
] as const;

/** Page path prefixes blocked when komunitas is disabled. */
export const KOMUNITAS_PAGE_PREFIXES = [
  "/komunitas",
  "/admin/chat-rooms",
  "/mentor/chat",
] as const;

export function isKomunitasApiPath(pathname: string): boolean {
  return KOMUNITAS_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isKomunitasPagePath(pathname: string): boolean {
  return KOMUNITAS_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
