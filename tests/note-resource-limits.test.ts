import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resetNoteMemoryRepo } from "../src/lib/note/repo";
import { NOTE_JOURNAL_ACCOUNT_MAX, NOTE_JOURNAL_LIST_MAX } from "../src/lib/note/resource-limits";
import { getNoteRepo } from "../src/lib/note/repo";

describe("Note journal resource limits", () => {
  it("caps listEntries at NOTE_JOURNAL_LIST_MAX", async () => {
    process.env.NOTE_REPO = "memory";
    resetNoteMemoryRepo();
    const repo = getNoteRepo();
    const uid = "limit-test-user";
    const seed = Math.min(NOTE_JOURNAL_LIST_MAX + 3, 120);
    for (let i = 0; i < seed; i++) {
      await repo.createEntry(uid, {
        kind: "TRADE",
        mode: "cepat",
        symbol: "TEST",
        side: "BUY",
        pnl: i,
      });
    }
    const listed = await repo.listEntries(uid);
    assert.equal(listed.length, Math.min(seed, NOTE_JOURNAL_LIST_MAX));
  });

  it("keeps account cap above list cap", () => {
    assert.ok(NOTE_JOURNAL_ACCOUNT_MAX > NOTE_JOURNAL_LIST_MAX);
  });
});
