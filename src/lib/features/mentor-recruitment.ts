/**
 * Public mentor recruitment (L1 self-apply) feature flag.
 * Disabled by default  -  set NEXT_PUBLIC_MENTOR_RECRUITMENT_ENABLED=true to restore.
 */

export const MENTOR_RECRUITMENT_ENABLED =
  process.env.NEXT_PUBLIC_MENTOR_RECRUITMENT_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_MENTOR_RECRUITMENT_ENABLED === "1";

/** Page path prefixes blocked when public recruitment is disabled. */
export const MENTOR_RECRUITMENT_PAGE_PREFIXES = [
  "/jadi-mentor",
] as const;

/** API route prefixes blocked when public recruitment is disabled. */
export const MENTOR_RECRUITMENT_API_PREFIXES = [
  "/api/mentor/applications",
] as const;

export function isMentorRecruitmentPagePath(pathname: string): boolean {
  if (pathname === "/jadi-mentor/lanjut" || pathname.startsWith("/jadi-mentor/lanjut/")) {
    return false;
  }
  return MENTOR_RECRUITMENT_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isMentorRecruitmentApiPath(pathname: string): boolean {
  if (
    pathname === "/api/mentor/applications/l2" ||
    pathname.startsWith("/api/mentor/applications/l2/")
  ) {
    return false;
  }
  return MENTOR_RECRUITMENT_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
