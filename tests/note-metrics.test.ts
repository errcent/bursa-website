import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeCoreMetrics } from "../src/lib/note/metrics/core";
import { computeRiskMetrics } from "../src/lib/note/metrics/risk";
import { computeNoteOverview } from "../src/lib/note/metrics/overview";
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
    openedAt: `2026-09-${String(seq).padStart(2, "0")}T10:00:00.000Z`,
    createdAt: "2026-09-01T10:00:00.000Z",
    ...partial,
  };
}

describe("metrics split", () => {
  const entries = [
    entry({ pnl: 100, actualRR: 2, openedAt: "2026-09-01T10:00:00.000Z" }),
    entry({ pnl: 50, actualRR: 1, openedAt: "2026-09-02T10:00:00.000Z" }),
    entry({ pnl: -30, actualRR: -0.5, openedAt: "2026-09-03T10:00:00.000Z" }),
  ];

  it("computes core counts and streaks", () => {
    const core = computeCoreMetrics(entries);
    assert.equal(core.closedCount, 3);
    assert.equal(core.wins, 2);
    assert.equal(core.maxWinStreak, 2);
    assert.equal(core.liveStreak, -1);
  });

  it("computes risk: recovery, R, fee drag", () => {
    const risk = computeRiskMetrics(entries);
    assert.equal(risk.stoppedTrades, 3);
    assert.ok(Math.abs((risk.avgRealizedR ?? 0) - (2.5 / 3)) < 1e-9);
    assert.equal(risk.feeDragRatio, 0);
    assert.ok((risk.recoveryFactor ?? 0) > 0);
  });

  it("bundles overview in one call", () => {
    const overview = computeNoteOverview(entries);
    assert.equal(overview.days.length, 3);
    assert.equal(overview.equity[overview.equity.length - 1]!.cumulative, 120);
    assert.equal(overview.core.closedCount, 3);
  });
});
