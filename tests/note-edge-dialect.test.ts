import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeEdgeDialect, BURSA_EDGE_MIN_TRADES } from "../src/lib/note/edge-dialect";
import type { JournalEntry } from "../src/lib/note/types";

let seq = 0;
function entry(partial: Partial<JournalEntry>): JournalEntry {
  seq += 1;
  const pnl = partial.pnl ?? 0;
  return {
    id: `e${seq}`,
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
    openedAt: `2026-09-${String(seq).padStart(2, "0")}T10:00:00.000Z`,
    createdAt: "2026-09-01T10:00:00.000Z",
    ...partial,
  };
}

describe("computeEdgeDialect", () => {
  it("withholds the score under the minimum trade count", () => {
    const entries = Array.from({ length: BURSA_EDGE_MIN_TRADES - 1 }, (_, i) =>
      entry({ pnl: 10, openedAt: `2026-09-${String(i + 1).padStart(2, "0")}T10:00:00.000Z` }),
    );
    const d = computeEdgeDialect(entries);
    assert.equal(d.score, null);
    assert.equal(d.closedTrades, BURSA_EDGE_MIN_TRADES - 1);
    assert.equal(d.version, 1);
  });

  it("scores a perfect record at full marks", () => {
    const entries = Array.from({ length: 12 }, (_, i) =>
      entry({
        pnl: 10,
        fees: 0.1,
        actualRR: 2,
        openedAt: `2026-09-${String(i + 1).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );
    const d = computeEdgeDialect(entries);
    assert.ok(d.score != null && d.score >= 90, `score=${d.score}`);
    assert.equal(Math.round(d.components.winRate), 100);
    assert.equal(Math.round(d.components.profitFactor), 100);
    assert.equal(Math.round(d.components.expectancyR), 100);
  });

  it("penalizes fee drag and concentration", () => {
    const heavy = Array.from({ length: 10 }, () =>
      entry({ pnl: 10, fees: 5, openedAt: "2026-09-01T10:00:00.000Z" }),
    );
    const d = computeEdgeDialect(heavy);
    // fees 50/gross 100 = 50% drag → zero; single day → full concentration
    assert.equal(Math.round(d.components.feeDrag), 0);
    assert.ok(d.components.consistency < 50);
    assert.ok((d.score ?? 100) < 80);
  });

  it("treats missing R samples as neutral, not zero", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry({ pnl: 10, openedAt: `2026-09-${String(i + 1).padStart(2, "0")}T10:00:00.000Z` }),
    );
    const d = computeEdgeDialect(entries);
    assert.equal(d.components.expectancyR, 50);
  });
});
