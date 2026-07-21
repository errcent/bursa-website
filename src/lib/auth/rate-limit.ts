import { NextResponse } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DEFAULT_API_LIMIT = 120;
const BOT_UA_LIMIT = 30;
const DEFAULT_API_WINDOW_MS = 60_000;

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/** In-memory fixed-window rate limit (per key). */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkApiRateLimit(request: Request): RateLimitResult {
  const ip = clientIp(request);
  const auth = request.headers.get("authorization")?.trim();
  const key = auth ? `user:${auth.slice(0, 32)}` : `ip:${ip}`;
  const ua = request.headers.get("user-agent") || "";
  let limit = DEFAULT_API_LIMIT;
  if (/bot|crawler|spider/i.test(ua)) {
    limit = BOT_UA_LIMIT;
  }
  return checkRateLimit(key, limit, DEFAULT_API_WINDOW_MS);
}

export function rateLimitResponse(retryAfterSec?: number) {
  const headers: Record<string, string> = {};
  if (retryAfterSec) headers["Retry-After"] = String(retryAfterSec);
  return NextResponse.json(
    { error: "Terlalu banyak permintaan." },
    { status: 429, headers }
  );
}
