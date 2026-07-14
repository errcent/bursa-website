import { NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

/**
 * Simple in-memory sliding-window rate limiter for prototype API routes.
 * Production should use Redis (@upstash/ratelimit) per security docs.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
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
  const pathname = new URL(request.url).pathname;

  if (pathname.startsWith("/api/auth/")) {
    return checkRateLimit(`api-auth:${ip}`, 30, 60 * 1000);
  }

  return checkRateLimit(`api:${ip}`, 120, 60 * 1000);
}

export function rateLimitResponse(retryAfterSec?: number) {
  return NextResponse.json(
    {
      error: retryAfterSec
        ? `Terlalu banyak permintaan. Coba lagi dalam ${retryAfterSec} detik.`
        : "Terlalu banyak permintaan.",
    },
    {
      status: 429,
      headers: retryAfterSec
        ? { "Retry-After": String(retryAfterSec) }
        : undefined,
    }
  );
}
