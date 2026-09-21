import { isUpstashRateLimitConfigured } from "@/lib/auth/rate-limit-upstash";
import {
  WEB_SESSION_REMEMBER_TTL_SEC,
  WEB_SESSION_SV_REDIS_PREFIX,
} from "@/lib/auth/web-session.constants";
import { db } from "@/lib/db";

export { WEB_SESSION_SV_REDIS_PREFIX };

/** Read current sessionVersion for a user (DB SSOT). */
export async function getWebSessionVersion(userId: string): Promise<number> {
  const row = await db.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  return row?.sessionVersion ?? 0;
}

/**
 * U-005: bump sessionVersion and mirror to Redis for edge verify.
 * Prefer calling from password reset / OAuth reclaim after other session wipes.
 */
export async function bumpWebSessionVersion(userId: string): Promise<number> {
  const updated = await db.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await mirrorSessionVersionToRedis(userId, updated.sessionVersion);
  return updated.sessionVersion;
}

export async function mirrorSessionVersionToRedis(
  userId: string,
  version: number
): Promise<void> {
  if (!isUpstashRateLimitConfigured()) return;
  try {
    const { Redis } = await import("@upstash/redis");
    await Redis.fromEnv().set(`${WEB_SESSION_SV_REDIS_PREFIX}${userId}`, version, {
      ex: WEB_SESSION_REMEMBER_TTL_SEC,
    });
  } catch (error) {
    console.error("[web-session] sessionVersion redis mirror failed:", error);
  }
}
