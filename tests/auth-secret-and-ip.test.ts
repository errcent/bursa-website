import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAuthSecret, isNextBuildPhase } from "@/lib/auth/auth-secret";
import { clientIp } from "@/lib/auth/rate-limit";

describe("QC-20260819-02 auth secret", () => {
  it("returns env secret when set", () => {
    const previous = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "runtime-secret-value";
    delete process.env.NEXT_PHASE;
    try {
      assert.equal(getAuthSecret(), "runtime-secret-value");
    } finally {
      if (previous === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = previous;
    }
  });

  it("allows placeholder only during Next build phase", () => {
    const previousSecret = process.env.AUTH_SECRET;
    const previousNext = process.env.NEXTAUTH_SECRET;
    const previousPhase = process.env.NEXT_PHASE;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    process.env.NEXT_PHASE = "phase-production-build";
    try {
      assert.equal(isNextBuildPhase(), true);
      assert.match(getAuthSecret(), /placeholder/);
    } finally {
      if (previousSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = previousSecret;
      if (previousNext === undefined) delete process.env.NEXTAUTH_SECRET;
      else process.env.NEXTAUTH_SECRET = previousNext;
      if (previousPhase === undefined) delete process.env.NEXT_PHASE;
      else process.env.NEXT_PHASE = previousPhase;
    }
  });

  it("throws at runtime when secret is missing", () => {
    const previousSecret = process.env.AUTH_SECRET;
    const previousNext = process.env.NEXTAUTH_SECRET;
    const previousPhase = process.env.NEXT_PHASE;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXT_PHASE;
    try {
      assert.throws(() => getAuthSecret(), /AUTH_SECRET/);
    } finally {
      if (previousSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = previousSecret;
      if (previousNext === undefined) delete process.env.NEXTAUTH_SECRET;
      else process.env.NEXTAUTH_SECRET = previousNext;
      if (previousPhase === undefined) delete process.env.NEXT_PHASE;
      else process.env.NEXT_PHASE = previousPhase;
    }
  });
});

describe("QC-20260819-03 client IP", () => {
  it("ignores spoofed x-forwarded-for in production", () => {
    const request = new Request("https://bursanalar.com/api/auth/login", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "x-vercel-ip": "9.9.9.9",
      },
    });
    assert.equal(clientIp(request, "production"), "9.9.9.9");
  });

  it("does not fall back to x-forwarded-for in production", () => {
    const request = new Request("https://bursanalar.com/api/auth/login", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    assert.equal(clientIp(request, "production"), "unknown");
  });

  it("allows x-forwarded-for in development", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    assert.equal(clientIp(request, "development"), "1.2.3.4");
  });
});
