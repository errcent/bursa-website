import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canUseMode, countReviewsInWeek, filterEntriesForTier } from "../src/lib/note/entitlements";
import type { JournalEntry } from "../src/lib/note/types";

function entry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: "1",
    apexUserId: "u1",
    kind: "TRADE",
    mode: "cepat",
    symbol: "BBCA",
    side: "BUY",
    qty: null,
    entryPrice: null,
    exitPrice: null,
    fees: null,
    pnl: 10,
    result: "win",
    emotion: null,
    note: null,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    openedAt: "2026-09-02T00:00:00.000Z",
    createdAt: "2026-09-02T00:00:00.000Z",
    ...partial,
  };
}

describe("Note entitlements", () => {
  it("keeps all modes open in the habit phase", () => {
    assert.equal(canUseMode("cepat", { plus: false, reviewCountThisWeek: 99 }).ok, true);
    assert.equal(canUseMode("review", { plus: false, reviewCountThisWeek: 3 }).ok, true);
    assert.equal(canUseMode("review", { plus: false, reviewCountThisWeek: 9 }).ok, true);
    assert.equal(
      canUseMode("klinik", { plus: false, reviewCountThisWeek: 0, clinicModuleId: "overtrade" }).ok,
      true
    );
  });

  it("counts reviews in the same UTC week only", () => {
    const entries = [
      entry({ mode: "review", createdAt: "2026-09-01T10:00:00.000Z" }),
      entry({ mode: "review", createdAt: "2026-09-02T10:00:00.000Z" }),
      entry({ mode: "cepat", createdAt: "2026-09-02T11:00:00.000Z" }),
    ];
    assert.equal(countReviewsInWeek(entries, "2026-09-02T12:00:00.000Z"), 2);
  });

  it("does not hide history in the habit phase", () => {
    const entries = [
      entry({ id: "old", createdAt: "2026-07-01T00:00:00.000Z" }),
      entry({ id: "new", createdAt: "2026-09-01T00:00:00.000Z" }),
    ];
    const visible = filterEntriesForTier(entries, false, new Date("2026-09-02T00:00:00.000Z"));
    assert.deepEqual(visible.map((e) => e.id), ["old", "new"]);
  });
});
