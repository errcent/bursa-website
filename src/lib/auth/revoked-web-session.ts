import { db } from "@/lib/db";
import { isUpstashRateLimitConfigured } from "@/lib/auth/rate-limit-upstash";
import { REVOKED_JTI_REDIS_PREFIX } from "@/lib/auth/revoked-web-session-edge";

export async function revokeWebSessionJti(jti: string, expiresAt: Date): Promise<void> {
  await db.revokedWebSession.upsert({
    where: { jti },
    create: { jti, expiresAt },
    update: { expiresAt },
  });

  if (!isUpstashRateLimitConfigured()) return;
  try {
    const { Redis } = await import("@upstash/redis");
    const ttlSec = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
    await Redis.fromEnv().set(`${REVOKED_JTI_REDIS_PREFIX}${jti}`, "1", { ex: ttlSec });
  } catch (error) {
    console.error("[web-session] revoke redis failed:", error);
  }
}

export async function isWebSessionJtiRevoked(jti: string): Promise<boolean> {
  const row = await db.revokedWebSession.findUnique({
    where: { jti },
    select: { jti: true },
  });
  return Boolean(row);
}
