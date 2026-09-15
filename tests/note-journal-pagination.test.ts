import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseJournalListQuery } from "../src/lib/note/journal-list-query";
import { isNoteOpenAccessGuest } from "../src/lib/note/open-access";
import { resetNoteMemoryRepo, getNoteRepo } from "../src/lib/note/repo";
import { NOTE_JOURNAL_LIST_MAX } from "../src/lib/note/resource-limits";

describe("Journal list pagination", () => {
  it("parses limit and cursor", () => {
    const q = new URLSearchParams("limit=50&cursor=2026-01-01T00:00:00.000Z");
    const parsed = parseJournalListQuery(q);
    assert.equal(parsed.limit, 50);
    assert.equal(parsed.cursor, "2026-01-01T00:00:00.000Z");
  });

  it("returns nextCursor when more rows exist", async () => {
    process.env.NOTE_REPO = "memory";
    resetNoteMemoryRepo();
    const repo = getNoteRepo();
    const uid = "page-user";
    for (let i = 0; i < 5; i++) {
      await repo.createEntry(uid, {
        kind: "TRADE",
        mode: "cepat",
        symbol: "T",
        side: "BUY",
        pnl: i,
        openedAt: `2026-01-0${i + 1}T12:00:00+07:00`,
      });
    }
    const first = await repo.listEntriesPage(uid, { limit: 2 });
    assert.equal(first.entries.length, 2);
    assert.ok(first.nextCursor);
    const second = await repo.listEntriesPage(uid, { limit: 2, cursor: first.nextCursor });
    assert.equal(second.entries.length, 2);
  });

  it("treats note-preview- ids as open-access guests", () => {
    assert.equal(isNoteOpenAccessGuest("note-preview-11111111-1111-4111-8111-111111111111"), true);
    assert.equal(isNoteOpenAccessGuest("user-real-123"), false);
  });
});
