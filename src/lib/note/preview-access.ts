import { NextResponse } from "next/server";

import { readCookie } from "@/lib/note/session";

export const NOTE_PREVIEW_UID_COOKIE = "note_preview_uid";

const PREVIEW_UID_RE =
  /^note-preview-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function resolvePreviewUserId(request: Request): string {
  const raw = readCookie(request, NOTE_PREVIEW_UID_COOKIE);
  if (raw && PREVIEW_UID_RE.test(raw)) return raw;
  return `note-preview-${crypto.randomUUID()}`;
}

export function previewUserCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  };
}

/** Persist ephemeral preview identity so DB rows and rate limits are not shared across browsers. */
export function applyPreviewUserCookie(response: NextResponse, request: Request, userId: string) {
  if (!userId.startsWith("note-preview-")) return;
  const existing = readCookie(request, NOTE_PREVIEW_UID_COOKIE);
  if (existing === userId) return;
  response.cookies.set(NOTE_PREVIEW_UID_COOKIE, userId, previewUserCookieOptions());
}
