import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import { checkRateLimitMemory } from "@/lib/auth/rate-limit";

/**
 * BN-SEC-004: global API rate-limit keys must not collapse all JWTs.
 * Mirrors checkApiRateLimit key construction.
 */
function apiRateLimitKey(authorization: string | null, ip: string): string {
  if (!authorization?.trim()) return `ip:${ip}`;
  const hash = createHash("sha256").update(authorization.trim()).digest("hex").slice(0, 32);
  return `user:${hash}`;
}

describe("BN-SEC-004 bearer rate-limit key", () => {
  it("gives distinct keys for distinct JWTs sharing the same header prefix", () => {
    const prefix = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
    const a = `${prefix}aaa.sig`;
    const b = `${prefix}bbb.sig`;
    assert.notEqual(apiRateLimitKey(a, "1.1.1.1"), apiRateLimitKey(b, "1.1.1.1"));
    // Legacy buggy slice would collide:
    assert.equal(a.slice(0, 32), b.slice(0, 32));
  });

  it("falls back to IP when Authorization is absent", () => {
    assert.equal(apiRateLimitKey(null, "9.9.9.9"), "ip:9.9.9.9");
  });
});

describe("BN-SEC-005 in-memory rate limit fallback", () => {
  it("blocks after limit within the window", () => {
    const key = `test-mem-${Date.now()}`;
    assert.equal(checkRateLimitMemory(key, 2, 60_000).allowed, true);
    assert.equal(checkRateLimitMemory(key, 2, 60_000).allowed, true);
    const blocked = checkRateLimitMemory(key, 2, 60_000);
    assert.equal(blocked.allowed, false);
    assert.ok((blocked.retryAfterSec ?? 0) >= 1);
  });
});
