import { routeHasNavbar } from "@/lib/nav/route-navbar";

const STORAGE_KEY = "bursa-navbar-nav-context";

type NavbarNavContext = {
  hadNavbar: boolean;
};

function readContext(): NavbarNavContext {
  if (typeof window === "undefined") {
    return { hadNavbar: false };
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NavbarNavContext>;
      if (typeof parsed.hadNavbar === "boolean") {
        return { hadNavbar: parsed.hadNavbar };
      }
    }
  } catch {
    /* ignore quota / private mode / malformed JSON */
  }

  return { hadNavbar: false };
}

function writeContext(context: NavbarNavContext) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Play the slide-in intro when landing on a navbar page from a non-navbar route
 * (including the first navbar page in a session).
 */
export function shouldPlayNavbarIntro(pathname: string, prefersReducedMotion: boolean): boolean {
  if (prefersReducedMotion || !routeHasNavbar(pathname)) {
    return false;
  }

  return !readContext().hadNavbar;
}

/** Persist whether the active route shows SiteNavbar for the next navigation. */
export function syncNavbarRouteContext(pathname: string) {
  writeContext({ hadNavbar: routeHasNavbar(pathname) });
}
