import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDemoTrackStore } from "../src/lib/note/track/demo-seed";
import { buildTrackSnapshot } from "../src/lib/note/track/engine";
import { parseTrackDateTime } from "../src/lib/note/track/datetime";

describe("Track engine", () => {
  it("parses DD/MM/YY AM/PM WIB", () => {
    const iso = parseTrackDateTime("15/09/26", 9, "AM");
    assert.ok(iso?.includes("2026-09-15"));
  });

  it("builds holdings from demo store", () => {
    const store = buildDemoTrackStore();
    const snap = buildTrackSnapshot(store.transactions, {
      range: "all",
      baseCurrency: "USD",
      rates: { usdIdr: 15850 },
    });
    assert.ok(snap.totalValue > 0);
    assert.ok(snap.holdings.length >= 3);
    assert.ok(snap.allocationNow.length >= 3);
    assert.ok(snap.history.length > 0);
  });

  it("computes allocation over time weights ~100%", () => {
    const store = buildDemoTrackStore();
    const snap = buildTrackSnapshot(store.transactions, {
      range: "30d",
      now: new Date("2026-09-15T12:00:00+07:00"),
      baseCurrency: "IDR",
      rates: { usdIdr: 15850 },
    });
    const last = snap.allocationOverTime.at(-1);
    assert.ok(last);
    const sum = Object.values(last.weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 100) < 1 || sum === 0);
  });
});
