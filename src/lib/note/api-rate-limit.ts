import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { isNoteOpenAccessGuest } from "@/lib/note/open-access";
import type { NoteSession } from "@/lib/note/types";

export type NoteRateLimitProfile =
  | "econ"
  | "journal_read"
  | "journal_write"
  | "journal_import"
  | "broker_sync"
  | "ask"
  | "track_read"
  | "track_write"
  | "market_history"
  | "fx_spot"
  | "sso_consume";

const PROFILES: Record<
  NoteRateLimitProfile,
  { limit: number; guestLimit: number; windowMs: number }
> = {
  /** Calendar poll ~120s; cap scrapers hammering FF/scrape backends. */
  econ: { limit: 45, guestLimit: 18, windowMs: 60_000 },
  journal_read: { limit: 60, guestLimit: 25, windowMs: 60_000 },
  journal_write: { limit: 25, guestLimit: 12, windowMs: 60_000 },
  journal_import: { limit: 6, guestLimit: 3, windowMs: 60_000 },
  /** Broker sync fans out to signed third-party calls; strict cap. */
  broker_sync: { limit: 4, guestLimit: 0, windowMs: 60_000 },
  /** Ask fans out to aggregates and optionally one LLM call. */
  ask: { limit: 20, guestLimit: 8, windowMs: 60_000 },
  track_read: { limit: 40, guestLimit: 20, windowMs: 60_000 },
  track_write: { limit: 20, guestLimit: 10, windowMs: 60_000 },
  /** Each hit may fan out to multiple Yahoo chart calls. */
  market_history: { limit: 20, guestLimit: 10, windowMs: 60_000 },
  fx_spot: { limit: 40, guestLimit: 40, windowMs: 60_000 },
  sso_consume: { limit: 20, guestLimit: 20, windowMs: 60_000 },
};

export function noteRateLimitKey(request: NextRequest, session?: NoteSession | null): string {
  const ip = clientIp(request);
  if (session?.userId && !isNoteOpenAccessGuest(session.userId)) {
    return `note:uid:${session.userId}`;
  }
  return `note:ip:${ip}`;
}

export async function enforceNoteRateLimit(
  request: NextRequest,
  profile: NoteRateLimitProfile,
  session?: NoteSession | null
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const cfg = PROFILES[profile];
  const guest = !session?.userId || isNoteOpenAccessGuest(session.userId);
  const limit = guest ? cfg.guestLimit : cfg.limit;
  const key = `${noteRateLimitKey(request, session)}:${profile}`;
  const result = await checkRateLimit(key, limit, cfg.windowMs);
  if (!result.allowed) {
    return { ok: false, response: rateLimitResponse(result.retryAfterSec) };
  }
  return { ok: true };
}
