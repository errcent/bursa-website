import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * BN-SEC-003: Auth.js redirect allowlist logic (mirrors src/auth.ts callback).
 * Kept pure so we can unit-test without booting NextAuth.
 */
function resolveAuthRedirect(url: string, baseUrl: string): string {
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return `${baseUrl}${url}`;
  }
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    if (target.origin === base.origin) return target.toString();
  } catch {
    /* fall through */
  }
  return baseUrl;
}

describe("BN-SEC-003 auth redirect allowlist", () => {
  const base = "https://bursanalar.com";

  it("allows same-origin absolute URLs", () => {
    assert.equal(
      resolveAuthRedirect("https://bursanalar.com/dashboard", base),
      "https://bursanalar.com/dashboard"
    );
  });

  it("allows relative paths", () => {
    assert.equal(resolveAuthRedirect("/belajar", base), "https://bursanalar.com/belajar");
  });

  it("rejects prefix-host open redirects", () => {
    assert.equal(
      resolveAuthRedirect("https://bursanalar.com.evil.tld/phish", base),
      base
    );
  });

  it("rejects protocol-relative URLs", () => {
    assert.equal(resolveAuthRedirect("//evil.tld/phish", base), base);
  });

  it("rejects foreign origins", () => {
    assert.equal(resolveAuthRedirect("https://evil.tld/", base), base);
  });
});
