import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeMultipliers, resolveAccount } from "../src/lib/note/accounts";

describe("journal accounts", () => {
  it("resolves method and multipliers by label, case-insensitive", () => {
    const accounts = [
      { id: "a", label: "FTMO", method: "lifo" as const, multipliers: { ES: 50 }, createdAt: "" },
    ];
    const resolved = resolveAccount(accounts, "ftmo");
    assert.equal(resolved.method, "lifo");
    assert.deepEqual(resolved.pointValues, { ES: 50 });
  });

  it("falls back to FIFO when unmatched", () => {
    assert.deepEqual(resolveAccount([], "nope"), { method: "fifo", pointValues: {} });
    assert.deepEqual(resolveAccount([], null), { method: "fifo", pointValues: {} });
  });

  it("normalizes multiplier maps, dropping garbage", () => {
    assert.deepEqual(normalizeMultipliers({ es: 50, bad: -1, junk: "x", NQ: 20 }), { ES: 50, NQ: 20 });
    assert.deepEqual(normalizeMultipliers(null), {});
  });
});
