import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NextRequest } from "next/server";

import { enforceNoteRateLimit, noteRateLimitKey } from "../src/lib/note/api-rate-limit";
import { NOTE_OPEN_ACCESS_GUEST_ID } from "../src/lib/note/open-access";

describe("Note API rate limit keys", () => {
  it("uses user id for signed-in sessions", () => {
    const req = new NextRequest("https://note.bursanalar.com/api/note/economic-calendar");
    const key = noteRateLimitKey(req, { userId: "user-abc", email: "a@b.com", scopes: ["note.read"] });
    assert.equal(key, "note:uid:user-abc");
  });

  it("uses IP for open-access guest", () => {
    const req = new NextRequest("https://note.bursanalar.com/api/note/economic-calendar", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    const key = noteRateLimitKey(req, {
      userId: NOTE_OPEN_ACCESS_GUEST_ID,
      email: "preview@note.bursanalar.com",
      scopes: ["note.read"],
    });
    assert.equal(key, "note:ip:203.0.113.10");
  });
});

describe("Note API rate limit enforcement", () => {
  it("blocks after guest econ budget in window", async () => {
    const req = new NextRequest("https://note.bursanalar.com/api/note/economic-calendar", {
      headers: { "x-forwarded-for": `test-econ-${Date.now()}` },
    });
    const session = {
      userId: NOTE_OPEN_ACCESS_GUEST_ID,
      email: "preview@note.bursanalar.com",
      scopes: ["note.read", "note.write", "note.sync"],
    };
    for (let i = 0; i < 18; i++) {
      const r = await enforceNoteRateLimit(req, "econ", session);
      assert.equal(r.ok, true);
    }
    const blocked = await enforceNoteRateLimit(req, "econ", session);
    assert.equal(blocked.ok, false);
  });
});
