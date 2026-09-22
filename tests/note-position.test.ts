import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPositionCycles } from "../src/lib/note/position/cycle";
import type { Fill } from "../src/lib/note/position/types";

function fill(partial: Partial<Fill> & { id: string }): Fill {
  return {
    accountRef: "acc-1",
    ticker: "EURUSD",
    side: "buy",
    size: 1,
    price: 1,
    fee: 0,
    filledAt: "2026-09-01T10:00:00.000Z",
    origin: "import",
    ...partial,
  };
}

describe("buildPositionCycles", () => {
  it("builds a simple long win with fifo", () => {
    const cycles = buildPositionCycles([
      fill({ id: "a", side: "buy", size: 2, price: 100, filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "b", side: "sell", size: 2, price: 110, filledAt: "2026-09-01T11:00:00.000Z" }),
    ]);
    assert.equal(cycles.length, 1);
    assert.equal(cycles[0]!.outcome, "win");
    assert.equal(cycles[0]!.gross, 20);
    assert.equal(cycles[0]!.meanEntry, 100);
    assert.equal(cycles[0]!.meanExit, 110);
  });

  it("keeps cycle totals identical across fifo/lifo/average", () => {
    const fills = [
      fill({ id: "a", side: "buy", size: 1, price: 100, filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "b", side: "buy", size: 1, price: 120, filledAt: "2026-09-01T10:30:00.000Z" }),
      fill({ id: "c", side: "sell", size: 1, price: 130, filledAt: "2026-09-01T11:00:00.000Z" }),
      fill({ id: "d", side: "sell", size: 1, price: 140, filledAt: "2026-09-01T12:00:00.000Z" }),
    ];
    const totals = (["fifo", "lifo", "average"] as const).map(
      (method) => buildPositionCycles(fills, { method })[0]!.net,
    );
    assert.deepEqual(totals, [50, 50, 50]);
    // ...but per-slice attribution differs between fifo and lifo
    const fifoFirst = buildPositionCycles(fills, { method: "fifo" })[0]!.slices[0]!.realizedGross;
    const lifoFirst = buildPositionCycles(fills, { method: "lifo" })[0]!.slices[0]!.realizedGross;
    assert.equal(fifoFirst, 30);
    assert.equal(lifoFirst, 10);
  });

  it("splits fills that cross through flat and flips direction", () => {
    const cycles = buildPositionCycles([
      fill({ id: "a", side: "buy", size: 1, price: 100, filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "b", side: "sell", size: 3, price: 110, filledAt: "2026-09-01T11:00:00.000Z" }),
      fill({ id: "c", side: "buy", size: 2, price: 105, filledAt: "2026-09-01T12:00:00.000Z" }),
    ]);
    assert.equal(cycles.length, 2);
    assert.equal(cycles[0]!.direction, "long");
    assert.equal(cycles[0]!.net, 10);
    assert.equal(cycles[1]!.direction, "short");
    assert.equal(cycles[1]!.net, 10);
    // crossing fill id recorded in both cycles
    assert.ok(cycles[0]!.fillIds.includes("b"));
    assert.ok(cycles[1]!.fillIds.includes("b"));
  });

  it("splits fees pro-rata across the crossing share", () => {
    const cycles = buildPositionCycles([
      fill({ id: "a", side: "buy", size: 2, price: 100, filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "b", side: "sell", size: 2, price: 110, fee: 10, filledAt: "2026-09-01T11:00:00.000Z" }),
    ]);
    assert.equal(cycles[0]!.fees, 10);
    assert.equal(cycles[0]!.net, 10);
  });

  it("is deterministic regardless of input order", () => {
    const a = fill({ id: "a", side: "buy", size: 1, price: 100, filledAt: "2026-09-01T10:00:00.000Z" });
    const b = fill({ id: "b", side: "sell", size: 1, price: 110, filledAt: "2026-09-01T11:00:00.000Z" });
    const fwd = buildPositionCycles([a, b]);
    const rev = buildPositionCycles([b, a]);
    assert.deepEqual(fwd, rev);
  });

  it("applies contract multipliers to gross", () => {
    const cycles = buildPositionCycles(
      [
        fill({ id: "a", ticker: "ES", side: "buy", size: 1, price: 5000, filledAt: "2026-09-01T10:00:00.000Z" }),
        fill({ id: "b", ticker: "ES", side: "sell", size: 1, price: 5010, filledAt: "2026-09-01T11:00:00.000Z" }),
      ],
      { pointValues: { ES: 50 } },
    );
    assert.equal(cycles[0]!.gross, 500);
    assert.equal(cycles[0]!.pointValue, 50);
  });

  it("honors declared gross but surfaces variance instead of hiding it", () => {
    const cycles = buildPositionCycles([
      fill({ id: "a", side: "buy", size: 1, price: 100, filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "b", side: "sell", size: 1, price: 110, filledAt: "2026-09-01T11:00:00.000Z", declaredGross: 12 }),
    ]);
    assert.equal(cycles[0]!.gross, 12);
    assert.equal(cycles[0]!.grossVariance, 2);
  });

  it("keeps batch-tagged mirrors in separate cycles", () => {
    const cycles = buildPositionCycles([
      fill({ id: "a", side: "buy", size: 1, price: 100, batchTag: "copy-1", filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "b", side: "buy", size: 1, price: 100, batchTag: "copy-2", filledAt: "2026-09-01T10:00:00.000Z" }),
      fill({ id: "c", side: "sell", size: 1, price: 110, batchTag: "copy-1", filledAt: "2026-09-01T11:00:00.000Z" }),
      fill({ id: "d", side: "sell", size: 1, price: 110, batchTag: "copy-2", filledAt: "2026-09-01T11:00:00.000Z" }),
    ]);
    assert.equal(cycles.length, 2);
    assert.ok(cycles.every((c) => c.net === 10));
  });
});
