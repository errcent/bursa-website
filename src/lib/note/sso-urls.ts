import { APEX_HOST, NOTE_HOST, isProductionHostRouting } from "@/lib/hosts/hosts";

/** Only in-app Note paths may be restored after SSO. */
export function sanitizeNoteNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/note") || raw.startsWith("//")) return "/note";
  return raw;
}

export function noteSsoStartPath(next = "/note"): string {
  return `/api/note/sso/start?next=${encodeURIComponent(sanitizeNoteNext(next))}`;
}

function needsApexSsoUrl(): boolean {
  if (isProductionHostRouting()) return true;
  if (typeof window !== "undefined" && window.location.hostname === NOTE_HOST) return true;
  return false;
}

/** Web-session cookie lives on apex. Always start SSO there from the Note host. */
export function noteSsoStartHref(next = "/note"): string {
  const path = noteSsoStartPath(next);
  if (needsApexSsoUrl()) {
    return `https://${APEX_HOST}${path}`;
  }
  return path;
}

export function noteApexLoginHref(next = "/note"): string {
  const sso = noteSsoStartPath(next);
  if (needsApexSsoUrl()) {
    return `https://${APEX_HOST}/masuk?next=${encodeURIComponent(sso)}`;
  }
  return `/masuk?next=${encodeURIComponent(sso)}`;
}

export function rewriteNotePostAuthPath(rawNext: string): string {
  const path = rawNext.split("?")[0]?.split("#")[0] ?? rawNext;
  if (path === "/api/note/sso/start" || path.startsWith("/api/note/sso/start/")) {
    return rawNext;
  }
  if (path === "/note" || path.startsWith("/note/")) {
    return noteSsoStartPath(rawNext.startsWith("/note") ? rawNext : "/note");
  }
  return rawNext;
}
