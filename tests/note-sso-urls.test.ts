import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolvePostAuthRedirect } from "../src/lib/auth/redirect";
import {
  noteSsoStartPath,
  rewriteNotePostAuthPath,
  sanitizeNoteNext,
} from "../src/lib/note/sso-urls";

describe("Note SSO return paths", () => {
  it("rejects open redirects and non-note paths", () => {
    assert.equal(sanitizeNoteNext("https://evil.test"), "/note");
    assert.equal(sanitizeNoteNext("//evil.test"), "/note");
    assert.equal(sanitizeNoteNext("/katalog"), "/note");
    assert.equal(sanitizeNoteNext("/note/baru?mode=cepat"), "/note/baru?mode=cepat");
  });

  it("sends /note post-login to apex SSO start instead of the Note host", () => {
    assert.equal(rewriteNotePostAuthPath("/note"), noteSsoStartPath("/note"));
    assert.equal(
      resolvePostAuthRedirect("/note"),
      "/api/note/sso/start?next=%2Fnote"
    );
    assert.equal(
      resolvePostAuthRedirect("/note/baru?mode=review"),
      "/api/note/sso/start?next=%2Fnote%2Fbaru%3Fmode%3Dreview"
    );
  });

  it("keeps an existing SSO start next value", () => {
    const existing = "/api/note/sso/start?next=%2Fnote";
    assert.equal(resolvePostAuthRedirect(existing), existing);
  });
});
