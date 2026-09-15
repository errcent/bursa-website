import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isNoteOpenAccessPeriod,
  NOTE_AUTH_REQUIRED_FROM_ISO,
} from "../src/lib/note/open-access";

describe("Note open access (pre Oct 1 launch)", () => {
  it("is open before launch date WIB", () => {
    assert.equal(isNoteOpenAccessPeriod(new Date("2026-09-30T12:00:00+07:00")), true);
  });

  it("requires auth from Oct 1 WIB", () => {
    assert.equal(isNoteOpenAccessPeriod(new Date(NOTE_AUTH_REQUIRED_FROM_ISO)), false);
    assert.equal(isNoteOpenAccessPeriod(new Date("2026-10-02T00:00:00+07:00")), false);
  });
});
