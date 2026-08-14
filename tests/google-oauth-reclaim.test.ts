import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { OAUTH_PASSWORD_MARKER } from "../src/lib/auth/google-oauth";

/** Mirrors BN-SEC-001 reclaim predicate in upsertGoogleOAuthUser. */
function shouldReclaimUnverifiedPasswordAccount(existing: {
  passwordHash: string;
  emailVerifiedAt: Date | null;
}): boolean {
  const isOAuthOnly = existing.passwordHash === OAUTH_PASSWORD_MARKER;
  return !isOAuthOnly && !existing.emailVerifiedAt;
}

describe("BN-SEC-001 Google reclaim of unverified password accounts", () => {
  it("reclaims when password account is unverified", () => {
    assert.equal(
      shouldReclaimUnverifiedPasswordAccount({
        passwordHash: "$2a$12$attackerhash",
        emailVerifiedAt: null,
      }),
      true
    );
  });

  it("does not reclaim verified password accounts", () => {
    assert.equal(
      shouldReclaimUnverifiedPasswordAccount({
        passwordHash: "$2a$12$legithash",
        emailVerifiedAt: new Date(),
      }),
      false
    );
  });

  it("does not reclaim OAuth-only accounts via wipe path", () => {
    assert.equal(
      shouldReclaimUnverifiedPasswordAccount({
        passwordHash: OAUTH_PASSWORD_MARKER,
        emailVerifiedAt: null,
      }),
      false
    );
  });
});
