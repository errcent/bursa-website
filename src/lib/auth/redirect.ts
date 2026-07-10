/** Default landing after login/register — beranda. */
export const POST_AUTH_HOME = "/";

const AUTH_PAGES = ["/masuk", "/daftar"];

/**
 * Protected shells that must not stick across accounts.
 * Deep links (e.g. /belajar/..., /jadi-mentor, /admin) may still be honored
 * when present on the same login URL.
 */
const NON_RETURNABLE = new Set(["/dashboard", "/pengaturan", "/profil"]);

function pathOnly(href: string) {
  return href.split("?")[0]?.split("#")[0] ?? href;
}

/**
 * Resolve post-login/register destination from a `next` query value.
 * Defaults to beranda; rejects open redirects and sticky account shells.
 */
export function resolvePostAuthRedirect(
  rawNext: string | null | undefined,
  options?: { forceHome?: boolean }
): string {
  if (options?.forceHome) return POST_AUTH_HOME;
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return POST_AUTH_HOME;
  }

  const path = pathOnly(rawNext);
  if (!path.startsWith("/") || path.startsWith("//")) return POST_AUTH_HOME;
  if (AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return POST_AUTH_HOME;
  }
  if (NON_RETURNABLE.has(path)) return POST_AUTH_HOME;

  return rawNext;
}

/** Whether a path is safe to pass as `?next=` on the login URL. */
export function isReturnableAuthPath(href: string): boolean {
  return resolvePostAuthRedirect(href) !== POST_AUTH_HOME || pathOnly(href) === POST_AUTH_HOME;
}

export function buildLoginHref(returnPath?: string | null): string {
  if (!returnPath) return "/masuk";
  const next = resolvePostAuthRedirect(returnPath);
  if (next === POST_AUTH_HOME) return "/masuk";
  return `/masuk?next=${encodeURIComponent(next)}`;
}

export function buildRegisterHref(returnPath?: string | null): string {
  // New accounts always start at beranda — never carry another page's next.
  void returnPath;
  return "/daftar";
}
