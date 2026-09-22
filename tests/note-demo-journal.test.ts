import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  shouldServeDemoJournal,
  withDemoJournalFallback,
} from "../src/lib/note/demo-entries";
import type { JournalEntry } from "../src/lib/note/types";

const NOW = new Date("2026-09-15T12:00:00+07:00");

function trade(iso: string, pnl: number): JournalEntry {
  return {
    id: iso,
    apexUserId: "u",
    kind: "TRADE",
    mode: "cepat",
    symbol: "EURUSD",
    side: "BUY",
    qty: 1,
    entryPrice: null,
    exitPrice: null,
    fees: 0,
    pnl,
    result: pnl > 0 ? "win" : "loss",
    emotion: null,
    note: null,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    relatedCourseSlug: null,
    relatedLessonId: null,
    openedAt: iso,
    createdAt: iso,
  };
}

describe("Demo journal fallback", () => {
  it("flags sparse months during open access", () => {
    assert.equal(shouldServeDemoJournal([], NOW), true);
    const old = [trade("2026-08-20T03:00:00.000Z", 10)];
    assert.equal(shouldServeDemoJournal(old, NOW), true);
  });

  it("does not flag months with enough real closes", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      trade(`2026-09-${String(i + 1).padStart(2, "0")}T03:00:00.000Z`, 5)
    );
    assert.equal(shouldServeDemoJournal(many, NOW), false);
  });

  it("fallback is retired: always passes entries through without demo", () => {
    const sparse = [
      trade("2026-09-01T03:00:00.000Z", 60),
      trade("2026-09-15T03:00:00.000Z", 60),
    ];
    const { entries, demo } = withDemoJournalFallback(sparse);
    assert.equal(demo, false);
    assert.equal(entries, sparse);
    assert.equal(withDemoJournalFallback([]).demo, false);
  });
});
