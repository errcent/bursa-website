import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { routineScore, routinesForDate, type RoutinesState } from "../src/lib/note/routines";

describe("routines", () => {
  it("filters items by weekday schedule", () => {
    const items = [
      { id: "a", label: "x", phase: "pre" as const, weekdays: [] },
      // 2026-09-10 is a Thursday (4)
      { id: "b", label: "y", phase: "pre" as const, weekdays: [4] },
      { id: "c", label: "z", phase: "pre" as const, weekdays: [1] },
    ];
    const scheduled = routinesForDate(items, "2026-09-10");
    assert.deepEqual(scheduled.map((i) => i.id).sort(), ["a", "b"]);
  });

  it("scores completion and returns null when empty", () => {
    const state: RoutinesState = {
      items: [{ id: "a", label: "x", phase: "pre", weekdays: [] }],
      checks: { "2026-09-10": ["a"] },
      misses: [],
    };
    assert.equal(routineScore(state, "2026-09-10"), 1);
    assert.equal(routineScore({ items: [], checks: {}, misses: [] }, "2026-09-10"), null);
  });
});
