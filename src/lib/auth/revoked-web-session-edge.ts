import { isUpstashRateLimitConfigured } from "@/lib/auth/rate-limit-upstash";

export const REVOKED_JTI_REDIS_PREFIX = "bursanalar:revoked-jti:";

/** Edge-safe. Without Upstash this returns false (Node Prisma remains SSOT for APIs). */
export async function isWebSessionJtiRevokedEdge(jti: string): Promise<boolean> {
  if (!isUpstashRateLimitConfigured()) return false;
  try {
    const { Redis } = await import("@upstash/redis");
    const value = await Redis.fromEnv().get(`${REVOKED_JTI_REDIS_PREFIX}${jti}`);
    return value != null;
  } catch {
    return false;
  }
}
