import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { checkRateLimitUpstash, isUpstashRateLimitConfigured } from "@/lib/auth/rate-limit-upstash";

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

function hashKeyMaterial(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/** In-memory fixed-window rate limit (per key). Local/dev fallback. */
export function checkRateLimitMemory(
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

/**
 * Fixed-window rate limit (BN-SEC-005).
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set; otherwise process-local memory.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (isUpstashRateLimitConfigured()) {
    try {
      return await checkRateLimitUpstash(key, limit, windowMs);
    } catch (error) {
      console.error("[rate-limit] Upstash error; falling back to memory:", error);
      return checkRateLimitMemory(key, limit, windowMs);
    }
  }
  return checkRateLimitMemory(key, limit, windowMs);
}

export function clientIp(request: Request, env = process.env.NODE_ENV): string {
  if (env === "production") {
    const vercel = request.headers.get("x-vercel-ip")?.trim();
    if (vercel) return vercel;
    const cf = request.headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
    const real = request.headers.get("x-real-ip")?.trim();
    if (real) return real;
    return "unknown";
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function checkApiRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = clientIp(request);
  const auth = request.headers.get("authorization")?.trim();
  // BN-SEC-004: hash full Authorization value — never slice(0,32) JWT prefix.
  const key = auth ? `user:${hashKeyMaterial(auth)}` : `ip:${ip}`;
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
