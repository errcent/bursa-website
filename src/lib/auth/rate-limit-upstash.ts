export interface UpstashRateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export function isUpstashRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

/**
 * Distributed fixed-window limiter via Upstash Redis REST (BN-SEC-005).
 * Window is converted to seconds (minimum 1).
 */
export async function checkRateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number
): Promise<UpstashRateLimitResult> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redis = Redis.fromEnv();
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, `${windowSec} s`),
    prefix: "bursanalar:rl",
    analytics: false,
  });

  const result = await ratelimit.limit(key);
  if (result.success) {
    return { allowed: true };
  }

  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { allowed: false, retryAfterSec };
}
