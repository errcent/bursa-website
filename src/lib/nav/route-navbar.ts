/**
 * Routes that intentionally omit {@link SiteNavbar} (auth shells, workspaces, role panels).
 * Everything else is treated as a navbar page.
 */
const NO_NAVBAR_PREFIXES = [
  "/masuk",
  "/daftar",
  "/login",
  "/lupa-password",
  "/belajar",
  "/admin",
  "/mentor",
  "/developer",
] as const;

export function routeHasNavbar(pathname: string): boolean {
  if (!pathname) return false;

  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;

  return !NO_NAVBAR_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
