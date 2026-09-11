/**
 * Public self-serve registration (/daftar, POST /api/auth/register, new Google OAuth users).
 * Disabled by default — Founder Lock 2026-09-11: waitlist primary, curated early access.
 * Set NEXT_PUBLIC_PUBLIC_REGISTRATION_ENABLED=true to restore open signup.
 */

export const PUBLIC_REGISTRATION_ENABLED =
  process.env.NEXT_PUBLIC_PUBLIC_REGISTRATION_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_PUBLIC_REGISTRATION_ENABLED === "1";

export const PUBLIC_REGISTRATION_PAGE_PREFIXES = ["/daftar"] as const;

export const PUBLIC_REGISTRATION_API_PREFIXES = ["/api/auth/register"] as const;

export function isPublicRegistrationPagePath(pathname: string): boolean {
  return PUBLIC_REGISTRATION_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isPublicRegistrationApiPath(pathname: string): boolean {
  return PUBLIC_REGISTRATION_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
