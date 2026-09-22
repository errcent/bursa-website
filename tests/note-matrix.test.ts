import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCrossMatrix, dimValue } from "../src/lib/note/cross-matrix";
import type { JournalEntry } from "../src/lib/note/types";

let seq = 0;
function entry(partial: Partial<JournalEntry>): JournalEntry {
  seq += 1;
  const pnl = partial.pnl ?? 0;
  return {
    id: `m${seq}`,
    apexUserId: "u1",
    kind: "TRADE",
    mode: "cepat",
    symbol: "EURUSD",
    side: "BUY",
    qty: 1,
    entryPrice: 1,
    exitPrice: 1,
    fees: 0,
    pnl,
    result: pnl > 0 ? "win" : pnl < 0 ? "loss" : "be",
    emotion: null,
    note: null,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    relatedCourseSlug: null,
    relatedLessonId: null,
    openedAt: "2026-09-10T10:00:00.000Z",
    createdAt: "2026-09-10T10:00:00.000Z",
    ...partial,
  };
}

describe("buildCrossMatrix", () => {
  it("groups by symbol and sorts by net desc", () => {
    const entries = [
      entry({ symbol: "XAUUSD", pnl: -20 }),
      entry({ symbol: "EURUSD", pnl: 50 }),
      entry({ symbol: "EURUSD", pnl: 30 }),
    ];
    const cells = buildCrossMatrix(entries, "symbol");
    assert.equal(cells.length, 2);
    assert.equal(cells[0]!.row, "EURUSD");
    assert.equal(cells[0]!.net, 80);
    assert.equal(cells[0]!.trades, 2);
    assert.equal(cells[0]!.winRate, 1);
    assert.equal(cells[1]!.row, "XAUUSD");
  });

  it("supports two dimensions", () => {
    const entries = [
      entry({ symbol: "EURUSD", pnl: 10, session: "asian" }),
      entry({ symbol: "EURUSD", pnl: -5, session: "ny" }),
    ];
    const cells = buildCrossMatrix(entries, "symbol", "session");
    assert.equal(cells.length, 2);
    assert.equal(cells[0]!.col, "asian");
  });

  it("buckets thesis presence and weekday", () => {
    assert.equal(dimValue(entry({ thesis: "breakout" }), "thesis"), "thesis");
    assert.equal(dimValue(entry({}), "thesis"), "no-thesis");
    // 2026-09-10 is a Thursday
    assert.equal(dimValue(entry({ openedAt: "2026-09-10T10:00:00.000Z" }), "weekday"), "Thu");
  });
});
