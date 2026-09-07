import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generateDsarReferenceCode } from "../src/lib/privacy/reference-code";
import { hashOtp } from "../src/lib/privacy/otp";
import { isEmailCategoryAllowed } from "../src/lib/email/policy";

describe("DSAR helpers", () => {
  it("generates reference codes with DSR prefix", () => {
    const code = generateDsarReferenceCode(new Date("2026-09-07T00:00:00.000Z"));
    assert.match(code, /^DSR-20260907-[A-Z0-9]{4}$/);
  });

  it("hashes OTP deterministically", () => {
    const a = hashOtp("user@example.com", "DSR-20260907-ABCD", "123456");
    const b = hashOtp("user@example.com", "DSR-20260907-ABCD", "123456");
    const c = hashOtp("user@example.com", "DSR-20260907-ABCD", "654321");
    assert.equal(a, b);
    assert.notEqual(a, c);
  });

  it("allows privacy_dsar email category by default", () => {
    delete process.env.EMAIL_ALLOWED_CATEGORIES;
    assert.equal(isEmailCategoryAllowed("privacy_dsar"), true);
  });
});
