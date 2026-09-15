import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clampEconCalendarRange,
  clampMarketHistoryQuery,
  ECON_API_MAX_SPAN_DAYS,
} from "../src/lib/note/query-bounds";

describe("Note query bounds", () => {
  it("clamps economic calendar span to max days", () => {
    const now = new Date("2026-09-16T12:00:00+07:00");
    const { from, to, clamped } = clampEconCalendarRange("2026-01-01", "2026-12-31", now);
    assert.equal(clamped, true);
    const start = new Date(`${from}T12:00:00Z`).getTime();
    const end = new Date(`${to}T12:00:00Z`).getTime();
    const days = Math.round((end - start) / 86400000) + 1;
    assert.equal(days, ECON_API_MAX_SPAN_DAYS);
  });

  it("rejects market history that is too wide", () => {
    const bad = clampMarketHistoryQuery("2024-01-01", "2026-01-01", 3);
    assert.equal(bad.ok, false);
    const ok = clampMarketHistoryQuery("2026-01-01", "2026-06-01", 2);
    assert.equal(ok.ok, true);
  });

  it("rejects too many symbols for market history", () => {
    const bad = clampMarketHistoryQuery("2026-01-01", "2026-02-01", 20);
    assert.equal(bad.ok, false);
  });
});
