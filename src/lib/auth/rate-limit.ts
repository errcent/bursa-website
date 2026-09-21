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

/** In-memory fixed-window rate limit (per key). Local/dev fallback only. */
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
 * Fixed-window rate limit (BN-SEC-005 / U-013).
 * Uses Upstash Redis when configured. In production without Upstash:
 * fail closed (deny) so multi-instance Map fallback cannot dilute limits.
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
      if (process.env.NODE_ENV === "production") {
        return { allowed: false, retryAfterSec: 60 };
      }
      return checkRateLimitMemory(key, limit, windowMs);
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing in production; denying request (fail-closed)."
    );
    return { allowed: false, retryAfterSec: 60 };
  }

  return checkRateLimitMemory(key, limit, windowMs);
}

/**
 * Platform-controlled client IP (U-001).
 * Prefer x-vercel-forwarded-for, then x-forwarded-for, then x-real-ip.
 * Never trust client-supplied x-vercel-ip or cf-connecting-ip on direct Vercel.
 */
export function clientIp(request: Request, _env = process.env.NODE_ENV): string {
  const vercelFwd = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelFwd) return vercelFwd.split(",")[0]?.trim() || "unknown";

  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Normalize an email/identifier for rate-limit bucket keys. */
export function normalizeRateLimitId(value: string): string {
  return value.trim().toLowerCase();
}

const SESSION_READ_PATHS = new Set(["/api/auth/session", "/api/auth/web-session-bridge"]);
const SESSION_READ_LIMIT = 400;

export async function checkApiRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = clientIp(request);
  const auth = request.headers.get("authorization")?.trim();
  // BN-SEC-004: hash full Authorization value - never slice(0,32) JWT prefix.
  const key = auth ? `user:${hashKeyMaterial(auth)}` : `ip:${ip}`;
  const ua = request.headers.get("user-agent") || "";
  let limit = DEFAULT_API_LIMIT;
  if (/bot|crawler|spider/i.test(ua)) {
    limit = BOT_UA_LIMIT;
  }

  try {
    const pathname = new URL(request.url).pathname;
    if (request.method === "GET" && SESSION_READ_PATHS.has(pathname)) {
      return checkRateLimit(`${key}:session-read`, SESSION_READ_LIMIT, DEFAULT_API_WINDOW_MS);
    }
  } catch {
    /* ignore malformed URL */
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
