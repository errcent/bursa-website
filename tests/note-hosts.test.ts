import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NOTE_HOST,
  apexNoteRedirectTarget,
  hostRole,
  isNoteHostAllowedPath,
} from "../src/lib/hosts/hosts";

describe("Note host isolation", () => {
  it("maps note.bursanalar.com to the note role", () => {
    assert.equal(hostRole(NOTE_HOST), "note");
    assert.equal(hostRole("bursanalar.com"), "apex");
  });

  it("redirects apex /note paths to the note host", () => {
    assert.equal(apexNoteRedirectTarget("/note"), `https://${NOTE_HOST}/note`);
    assert.equal(apexNoteRedirectTarget("/note/baru"), `https://${NOTE_HOST}/note/baru`);
    assert.equal(apexNoteRedirectTarget("/katalog"), null);
  });

  it("allows only note app and note API on the note host", () => {
    assert.equal(isNoteHostAllowedPath("/"), true);
    assert.equal(isNoteHostAllowedPath("/note"), true);
    assert.equal(isNoteHostAllowedPath("/api/note/entries"), true);
    assert.equal(isNoteHostAllowedPath("/katalog"), false);
    assert.equal(isNoteHostAllowedPath("/api/me/profile"), false);
  });
});
