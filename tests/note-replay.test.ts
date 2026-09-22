import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeExcursions } from "../src/lib/note/replay/excursions";
import type { Candle } from "../src/lib/note/market/candles";

function candle(t: number, c: number): Candle {
  return { t, o: c, h: c, l: c, c, v: 0 };
}

const base = Date.parse("2026-09-10T10:00:00.000Z");

describe("computeExcursions", () => {
  it("computes MAE/MFE for a long winner", () => {
    const candles = [1, 2, 3, 4].map((i) => candle(base + i * 900_000, 100 + i));
    const r = computeExcursions(
      { direction: "long", qty: 2, entryPrice: 100, openedAtMs: base, closedAtMs: base + 5 * 900_000 },
      candles,
    );
    assert.equal(r.withheld, null);
    assert.equal(r.mae, 0);
    assert.equal(r.mfe, 8);
    assert.equal(r.candlesUsed, 4);
  });

  it("withholds below minimum coverage", () => {
    const r = computeExcursions(
      { direction: "long", qty: 1, entryPrice: 100, openedAtMs: base, closedAtMs: base + 900_000 },
      [candle(base + 450_000, 101)],
    );
    assert.equal(r.withheld, "low-coverage");
    assert.equal(r.mae, null);
  });

  it("flags shorts with inverted sign and detects gaps", () => {
    const candles = [
      candle(base + 900_000, 99),
      candle(base + 2 * 900_000, 98),
      candle(base + 3 * 900_000, 97),
      candle(base + 30 * 900_000, 96),
    ];
    const r = computeExcursions(
      { direction: "short", qty: 1, entryPrice: 100, openedAtMs: base, closedAtMs: base + 31 * 900_000 },
      candles,
    );
    assert.equal(r.withheld, null);
    assert.equal(r.mfe, 4);
    assert.equal(r.mae, 0);
    assert.ok(r.gaps >= 1);
  });
});
