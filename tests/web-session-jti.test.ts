import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeJwt, SignJWT } from "jose";

describe("QC-20260819-04 web session jti", () => {
  it("signed tokens carry a jti claim", async () => {
    const secret = new TextEncoder().encode("unit-test-secret-for-jti");
    const token = await new SignJWT({ sub: "u1", email: "a@b.c", typ: "web_session" })
      .setProtectedHeader({ alg: "HS256" })
      .setJti("jti-test-1")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);
    const payload = decodeJwt(token);
    assert.equal(payload.jti, "jti-test-1");
    assert.equal(payload.typ, "web_session");
  });
});
