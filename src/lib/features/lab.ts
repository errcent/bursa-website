/**
 * Bursa Lab calculators feature flag.
 * Disabled by default — set NEXT_PUBLIC_LAB_ENABLED=true to restore.
 */

export const LAB_ENABLED =
  process.env.NEXT_PUBLIC_LAB_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_LAB_ENABLED === "1";

/** Page path prefixes blocked when lab is disabled. */
export const LAB_PAGE_PREFIXES = ["/lab", "/wave-lab"] as const;

export function isLabPagePath(pathname: string): boolean {
  return LAB_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
