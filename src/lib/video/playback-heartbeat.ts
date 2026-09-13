import crypto from "node:crypto";

import { isPrototypeMode } from "@/lib/auth/prototype";

/**
 * Server-side playback heartbeat (QC-20260719-46).
 *
 * Client-reported `watchedSeconds` is trivially forgeable, so completion must be gated on
 * watch time the SERVER verified. On playback start the server issues a short-lived HMAC-signed
 * heartbeat token bound to (user, lesson). While playing, the client pings `/api/video/heartbeat`
 * with the token + current playhead. The server credits watch time by the *advance in playhead*
 * but clamps it to real wall-clock elapsed × a small speed factor, so seeking to the end or
 * replaying a token cannot mint watch time. Accumulated `verifiedWatchedSeconds` is the sole gate
 * for `completed=true`.
 */

const HEARTBEAT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2h, matches playback token lifetime.

export {
  HEARTBEAT_MAX_CREDIT_SECONDS,
  WATCH_COMPLETION_RATIO,
  computeHeartbeatCredit,
  type HeartbeatCredit,
  type HeartbeatCreditInput,
} from "@/lib/video/watch-credit";

function heartbeatSecret(): string {
  const secret = process.env.VIDEO_TOKEN_SECRET?.trim();
  if (secret) return secret;
  if (isPrototypeMode()) return "bursa-demo-secret-v1";
  throw new Error("VIDEO_TOKEN_SECRET must be set in production.");
}

export interface PlaybackHeartbeatToken {
  heartbeatToken: string;
  heartbeatExpiresAt: string;
}

interface HeartbeatPayload {
  userId: string;
  lessonId: string;
  /** Random per-playback-session id, lets us distinguish concurrent sessions if needed. */
  sid: string;
  /** Issued-at epoch ms. */
  iat: number;
  /** Expiry epoch ms. */
  exp: number;
}

function sign(body: string): string {
  return crypto.createHmac("sha256", heartbeatSecret()).update(body).digest("base64url");
}

/** Issue a signed heartbeat token bound to (userId, lessonId). */
export function issuePlaybackHeartbeatToken(
  userId: string,
  lessonId: string
): PlaybackHeartbeatToken {
  const iat = Date.now();
  const exp = iat + HEARTBEAT_TOKEN_TTL_MS;
  const payload: HeartbeatPayload = {
    userId,
    lessonId,
    sid: crypto.randomUUID(),
    iat,
    exp,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${body}.${sign(body)}`;
  return { heartbeatToken: token, heartbeatExpiresAt: new Date(exp).toISOString() };
}

/** Verify a heartbeat token's signature + expiry. Returns the payload, or null if invalid. */
export function verifyPlaybackHeartbeatToken(token: string): HeartbeatPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature) return null;

  const expected = sign(body);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as HeartbeatPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (!payload.userId || !payload.lessonId) return null;
    return payload;
  } catch {
    return null;
  }
}
