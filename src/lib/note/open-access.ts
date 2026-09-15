/** Launch gate: auth required on note.bursanalar.com from this instant (WIB). */
export const NOTE_AUTH_REQUIRED_FROM_ISO = "2026-10-01T00:00:00+07:00";

export const NOTE_OPEN_ACCESS_GUEST_ID = "note-open-access-guest";
export const NOTE_OPEN_ACCESS_GUEST_EMAIL = "preview@note.bursanalar.com";

/**
 * Pre-launch window (hidden host): full Note without Bursa login.
 * Override: NOTE_REQUIRE_AUTH=1 (force login) | NOTE_REQUIRE_AUTH=0 (force open).
 */
export function isNoteOpenAccessPeriod(now = new Date()): boolean {
  const forced = process.env.NOTE_REQUIRE_AUTH?.trim();
  if (forced === "1" || forced === "true") return false;
  if (forced === "0" || forced === "false") return true;
  const deadline = new Date(NOTE_AUTH_REQUIRED_FROM_ISO);
  return now.getTime() < deadline.getTime();
}

export function isNoteOpenAccessGuest(userId: string): boolean {
  return userId === NOTE_OPEN_ACCESS_GUEST_ID || userId.startsWith("note-preview-");
}
