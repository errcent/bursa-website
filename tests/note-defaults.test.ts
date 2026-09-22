import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_JOURNAL_DEFAULTS, normalizeDefaults } from "../src/lib/note/defaults";
import { inferJournalResult } from "../src/lib/note/stats";
import { interpretInTz, isValidTimezone } from "../src/lib/note/statements/timezone";

describe("journal defaults", () => {
  it("normalizes garbage to safe defaults", () => {
    const d = normalizeDefaults({ breakevenBand: -5, defaultFee: "x", multipliers: { ES: 50, BAD: -1 }, statementTz: "Mars/Olympus" });
    assert.deepEqual(d, { breakevenBand: 0, defaultFee: 0, multipliers: { ES: 50 }, statementTz: "Asia/Jakarta" });
    assert.equal(DEFAULT_JOURNAL_DEFAULTS.statementTz, "Asia/Jakarta");
  });

  it("applies the breakeven band at inference", () => {
    assert.equal(inferJournalResult(0.005, null, 0.01), "be");
    assert.equal(inferJournalResult(0.02, null, 0.01), "win");
    assert.equal(inferJournalResult(-0.005, null, 0.01), "be");
    assert.equal(inferJournalResult(5, "win", 10), "win");
  });
});

describe("statement timezone", () => {
  it("validates IANA zones", () => {
    assert.equal(isValidTimezone("Asia/Jakarta"), true);
    assert.equal(isValidTimezone("America/New_York"), true);
    assert.equal(isValidTimezone("Not/AZone"), false);
  });

  it("keeps offset-bearing inputs untouched", () => {
    assert.equal(interpretInTz("2026-09-20T10:00:00Z", "Asia/Jakarta"), "2026-09-20T10:00:00.000Z");
  });

  it("interprets naive wall time in the statement zone", () => {
    // Jakarta is UTC+7 (no DST): 17:00 WIB == 10:00Z.
    assert.equal(interpretInTz("2026-09-20 17:00", "Asia/Jakarta"), "2026-09-20T10:00:00.000Z");
    assert.equal(interpretInTz("2026-09-20", "UTC"), "2026-09-20T00:00:00.000Z");
    assert.equal(interpretInTz("garbage!!", "Asia/Jakarta"), null);
  });
});
