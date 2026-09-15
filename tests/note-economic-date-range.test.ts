import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addDays,
  apiEnvelopeForRange,
  eventInRange,
  rangeForPreset,
  rangeWithinSingleCalendarMonth,
} from "../src/lib/note/economic-calendar/date-range";

describe("Economic date range", () => {
  it("adds days in UTC date parts", () => {
    assert.equal(addDays("2026-09-15", 1), "2026-09-16");
  });

  it("detects single calendar month range", () => {
    assert.equal(
      rangeWithinSingleCalendarMonth({ from: "2026-09-01", to: "2026-09-30" }),
      true
    );
    assert.equal(
      rangeWithinSingleCalendarMonth({ from: "2026-09-15", to: "2026-10-02" }),
      false
    );
  });

  it("today preset is single day", () => {
    const r = rangeForPreset("today", "2026-09-15");
    assert.equal(r.from, "2026-09-15");
    assert.equal(r.to, "2026-09-15");
  });

  it("expands API envelope to full months", () => {
    const env = apiEnvelopeForRange({ preset: "custom", from: "2026-09-15", to: "2026-10-02" });
    assert.equal(env.from, "2026-09-01");
    assert.equal(env.to, "2026-10-31");
  });

  it("filters event dates inclusively", () => {
    const r = { preset: "today" as const, from: "2026-09-15", to: "2026-09-16" };
    assert.equal(eventInRange("2026-09-15", r), true);
    assert.equal(eventInRange("2026-09-14", r), false);
  });
});
