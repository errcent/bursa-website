import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAnalyticsSurfaceGrid } from "../src/lib/note/analytics/surface-grid";
import type { JournalEntry } from "../src/lib/note/types";

function trade(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? "1",
    apexUserId: "u",
    kind: "TRADE",
    mode: "cepat",
    symbol: "EURUSD",
    side: "BUY",
    qty: 1,
    entryPrice: null,
    exitPrice: null,
    fees: 0,
    pnl: 10,
    result: "win",
    emotion: "tenang",
    note: null,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    relatedCourseSlug: null,
    relatedLessonId: null,
    openedAt: "2026-09-10T09:00:00+07:00",
    createdAt: "2026-09-10T09:00:00+07:00",
    ...partial,
  };
}

describe("Analytics surface grid", () => {
  it("builds session × symbol win rate matrix", () => {
    const entries = [
      trade({ id: "a", symbol: "EURUSD", pnl: 20, openedAt: "2026-09-02T09:00:00+07:00" }),
      trade({ id: "b", symbol: "EURUSD", pnl: -5, openedAt: "2026-09-02T10:00:00+07:00" }),
      trade({ id: "c", symbol: "XAUUSD", pnl: 15, openedAt: "2026-09-03T15:00:00+07:00" }),
    ];
    const grid = buildAnalyticsSurfaceGrid({
      entries,
      xAxis: "session",
      yAxis: "symbol",
      metric: "win_rate",
      from: "2026-09-01",
      to: "2026-09-30",
      includeBe: true,
      locale: "id",
      topRows: 5,
    });
    assert.equal(grid.empty, false);
    assert.ok(grid.yLabels.includes("EURUSD"));
    assert.ok(grid.xLabels.length >= 2);
    const eurusdRow = grid.yKeys.indexOf("EURUSD");
    assert.ok(eurusdRow >= 0);
    const hasWinRate = grid.z[eurusdRow]?.some((v) => v != null && v > 0);
    assert.equal(hasWinRate, true);
  });

  it("excludes BE when includeBe is false", () => {
    const entries = [trade({ pnl: 0, result: "be" })];
    const grid = buildAnalyticsSurfaceGrid({
      entries,
      xAxis: "side",
      yAxis: "symbol",
      metric: "count",
      includeBe: false,
      locale: "en",
    });
    assert.equal(grid.filteredCount, 0);
    assert.equal(grid.empty, true);
  });
});
