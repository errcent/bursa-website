import { POST_AUTH_HOME, resolvePostAuthRedirect } from "@/lib/auth/redirect";

export const OAUTH_NEXT_STORAGE_KEY = "bursa-oauth-next";

function isBrowser() {
  return typeof window !== "undefined";
}

export function storeOAuthNext(next: string): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(OAUTH_NEXT_STORAGE_KEY, resolvePostAuthRedirect(next));
  } catch {
    // ignore
  }
}

export function readOAuthNext(fallback?: string | null): string {
  if (isBrowser()) {
    try {
      const stored = sessionStorage.getItem(OAUTH_NEXT_STORAGE_KEY);
      if (stored) return resolvePostAuthRedirect(stored);
    } catch {
      // ignore
    }
  }
  return resolvePostAuthRedirect(fallback ?? POST_AUTH_HOME);
}

export function clearOAuthNext(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function buildOAuthCallbackUrl(next: string): string {
  const resolved = resolvePostAuthRedirect(next);
  const url = new URL("/auth/google-done", typeof window !== "undefined" ? window.location.origin : "http://localhost");
  url.searchParams.set("next", resolved);
  return url.toString();
}
