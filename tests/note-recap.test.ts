import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSessionRecap, buildTradeCritique, latestTradingDay } from "../src/lib/note/recap";
import type { JournalEntry } from "../src/lib/note/types";

let seq = 0;
function entry(partial: Partial<JournalEntry>): JournalEntry {
  seq += 1;
  const pnl = partial.pnl ?? 0;
  return {
    id: `r${seq}`,
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
    openedAt: "2026-09-10T10:00:00.000Z",
    createdAt: "2026-09-10T10:00:00.000Z",
    ...partial,
  };
}

const fmt = { compact: false, decimals: 0, currency: "USD" as const, locale: "en" as const };

describe("session recaps", () => {
  it("returns null with no trades on the day", () => {
    assert.equal(buildSessionRecap([], "2026-09-10", "en", fmt), null);
  });

  it("builds a headline plus best/worst bullets", () => {
    const entries = [
      entry({ pnl: 50, symbol: "EURUSD" }),
      entry({ pnl: -20, symbol: "XAUUSD" }),
    ];
    const recap = buildSessionRecap(entries, "2026-09-10", "en", fmt)!;
    assert.ok(recap);
    assert.match(recap.headline, /1W-1L/);
    assert.ok(recap.bullets.length >= 1);
    assert.equal(recap.tone, "up");
    assert.equal(recap.version, 1);
  });

  it("flags fee drag above 5% of gross", () => {
    const entries = [entry({ pnl: 100, fees: 10 })];
    const recap = buildSessionRecap(entries, "2026-09-10", "en", fmt)!;
    assert.ok(recap.bullets.some((b) => /fee/i.test(b)));
  });

  it("finds the latest trading day", () => {
    const entries = [
      entry({ pnl: 5, openedAt: "2026-09-08T10:00:00.000Z" }),
      entry({ pnl: 5, openedAt: "2026-09-12T10:00:00.000Z" }),
    ];
    assert.equal(latestTradingDay(entries), "2026-09-12");
  });
});

describe("trade critiques", () => {
  it("asks for a stop when R is unknowable", () => {
    const c = buildTradeCritique(entry({ pnl: 10 }), 1, "en", fmt);
    assert.ok(c.bullets.some((b) => /stop/i.test(b)));
    assert.ok(c.fix.length > 0);
  });

  it("flags below-average R with a hold-winners fix", () => {
    const c = buildTradeCritique(entry({ pnl: 5, actualRR: 0.2 }), 1.5, "en", fmt);
    assert.ok(c.bullets.some((b) => /average R/i.test(b)));
    assert.match(c.fix, /hold winners/i);
  });

  it("flags tilt emotion on losses", () => {
    const c = buildTradeCritique(entry({ pnl: -10, emotion: "revenge", thesis: "breakout" }), 1, "en", fmt);
    assert.ok(c.bullets.some((b) => /tilt/i.test(b)));
    assert.equal(c.tone, "down");
  });
});
