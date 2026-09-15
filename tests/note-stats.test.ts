import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOTE_DEMO_ENTRIES } from "../src/lib/note/demo-entries";
import {
  cumulativePnl,
  dayKey,
  filterEntries,
  groupBySymbol,
  outcomePercentages,
  inferJournalResult,
  loggingStreak,
  sundayIndex,
  weekPad,
  weekdayLabels,
  monthBuckets,
  monthlyPnlStackPoints,
  alignedCumulativeSeries,
  pnlStackPoints,
  monthlyReturnsGrid,
  summarizeJournal,
  weekdayNets,
  formatPnl,
  formatNoteTimestamp,
  latestActivityIso,
} from "../src/lib/note/stats";
import type { JournalEntry } from "../src/lib/note/types";

function entry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: "x",
    apexUserId: "u",
    kind: "TRADE",
    mode: "cepat",
    symbol: "EURUSD",
    side: "BUY",
    qty: null,
    entryPrice: null,
    exitPrice: null,
    fees: null,
    pnl: null,
    result: null,
    emotion: null,
    note: null,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    relatedCourseSlug: null,
    relatedLessonId: null,
    openedAt: "2026-09-02T03:00:00.000Z",
    createdAt: "2026-09-02T03:00:00.000Z",
    ...partial,
  };
}

describe("Note journal stats", () => {
  it("infers win/loss/be from pnl when result is empty", () => {
    assert.equal(inferJournalResult(12), "win");
    assert.equal(inferJournalResult(-4), "loss");
    assert.equal(inferJournalResult(0), "be");
    assert.equal(inferJournalResult(null), null);
    assert.equal(inferJournalResult(12, "open"), "open");
  });

  it("computes win rate, profit factor, and expectancy from signed pnl", () => {
    const snap = summarizeJournal([
      entry({ pnl: 100, result: "win" }),
      entry({ pnl: 50, result: "win" }),
      entry({ pnl: -50, result: "loss" }),
    ]);
    assert.equal(snap.wins, 2);
    assert.equal(snap.losses, 1);
    assert.equal(snap.winRate, 2 / 3);
    assert.equal(snap.profitFactor, 3);
    assert.equal(snap.pnlSum, 100);
    assert.equal(snap.expectancy, 100 / 3);
  });

  it("excludes open rows from expectancy", () => {
    const snap = summarizeJournal([
      entry({ pnl: 10, result: "win" }),
      entry({ id: "o", pnl: 0, result: "open" }),
    ]);
    assert.equal(snap.expectancy, 10);
    assert.equal(snap.closedCount, 1);
    assert.equal(snap.open, 1);
  });

  it("filters by kind, result, and Jakarta day", () => {
    const rows = [
      entry({ id: "t", kind: "TRADE", pnl: 10, result: "win", openedAt: "2026-09-01T17:00:00.000Z" }),
      entry({ id: "i", kind: "INVEST", pnl: -5, result: "loss", openedAt: "2026-09-01T17:00:00.000Z" }),
    ];
    const day = dayKey("2026-09-01T17:00:00.000Z");
    assert.equal(filterEntries(rows, { kind: "INVEST", result: "ALL", date: day }).length, 1);
    assert.equal(filterEntries(rows, { kind: "ALL", result: "win" }).map((e) => e.id).join(), "t");
  });

  it("builds a month grid with Sunday-first index", () => {
    const buckets = monthBuckets(
      [entry({ openedAt: "2026-09-02T03:00:00.000Z", pnl: 20, note: "ok" })],
      2026,
      8
    );
    assert.equal(buckets.length, 30);
    const day = buckets.find((b) => b.date === dayKey("2026-09-02T03:00:00.000Z"));
    assert.equal(day?.count, 1);
    assert.equal(day?.hasNote, true);
    assert.equal(day?.pnl, 20);
    assert.equal(sundayIndex("2026-09-01"), 2);
    assert.equal(sundayIndex("2026-08-30"), 0);
    assert.equal(weekPad("2026-09-01", "sunday"), 2);
    assert.equal(weekPad("2026-09-01", "monday"), 1);
    assert.deepEqual([...weekdayLabels("sunday", "id")], ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]);
    assert.deepEqual([...weekdayLabels("sunday", "en")], ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    assert.deepEqual([...weekdayLabels("monday", "en")], ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("buckets weekday nets Sunday-first", () => {
    const nets = weekdayNets([
      entry({ openedAt: "2026-08-30T03:00:00.000Z", pnl: 5 }),
      entry({ openedAt: "2026-09-01T03:00:00.000Z", pnl: -2 }),
    ]);
    assert.equal(nets.length, 7);
    assert.equal(nets[0].net, 5);
    assert.equal(nets[2].net, -2);
  });

  it("outcomePercentages respects includeBe toggle", () => {
    const withBe = outcomePercentages(4, 2, 2, true);
    assert.equal(withBe.winPct, 50);
    assert.equal(withBe.bePct, 25);
    assert.equal(withBe.lossPct, 25);
    assert.equal(withBe.winRate, 0.5);

    const noBe = outcomePercentages(4, 2, 2, false);
    assert.ok(Math.abs(noBe.winPct - (400 / 6)) < 1e-6);
    assert.equal(noBe.bePct, 0);
    assert.ok(Math.abs(noBe.winRate! - 4 / 6) < 1e-6);
  });

  it("groups symbol with win rate", () => {
    const rows = [
      entry({ symbol: "BBCA", pnl: 20, result: "win" }),
      entry({ id: "2", symbol: "BBCA", pnl: -5, result: "loss" }),
      entry({ id: "3", symbol: "ETH", pnl: 10, result: "win" }),
    ];
    const symbols = groupBySymbol(rows);
    assert.equal(symbols[0].key, "BBCA");
    assert.equal(symbols[0].net, 15);
    assert.equal(symbols[0].count, 2);
    assert.equal(symbols[0].winRate, 0.5);
    assert.equal(symbols[0].wins, 1);
    assert.equal(symbols[0].losses, 1);
    assert.equal(symbols[0].be, 0);
  });

  it("counts logging streak walking back from today", () => {
    const today = dayKey("2026-09-02T03:00:00.000Z");
    const yesterday = "2026-09-01";
    const rows = [
      entry({ openedAt: "2026-09-02T03:00:00.000Z" }),
      entry({ id: "y", openedAt: "2026-09-01T03:00:00.000Z" }),
    ];
    assert.equal(loggingStreak(rows, "2026-09-02T03:00:00.000Z"), 2);
    assert.ok(today);
    assert.equal(sundayIndex(yesterday), 2);
  });

  it("builds pnl stack by day with hide empty", () => {
    const rows = [
      entry({ openedAt: "2026-06-10T03:00:00.000Z", pnl: 100, result: "win" }),
      entry({ openedAt: "2026-06-12T03:00:00.000Z", pnl: -20, result: "loss" }),
    ];
    const all = pnlStackPoints(rows, {
      granularity: "day",
      from: "2026-06-10",
      to: "2026-06-12",
      hideEmptyDays: false,
    });
    assert.equal(all.length, 3);
    const sparse = pnlStackPoints(rows, {
      granularity: "day",
      from: "2026-06-10",
      to: "2026-06-12",
      hideEmptyDays: true,
    });
    assert.equal(sparse.length, 2);
  });

  it("aligns cumulative series labels with trade stack", () => {
    const rows = [
      entry({ openedAt: "2026-06-10T03:00:00.000Z", pnl: 10, result: "win", symbol: "EURUSD" }),
      entry({ openedAt: "2026-06-11T03:00:00.000Z", pnl: -5, result: "loss", symbol: "XAUUSD" }),
    ];
    const stack = pnlStackPoints(rows, {
      granularity: "trade",
      from: "2026-06-01",
      to: "2026-06-30",
    });
    const cum = alignedCumulativeSeries(rows, {
      granularity: "trade",
      from: "2026-06-01",
      to: "2026-06-30",
    });
    assert.equal(cum.length, stack.length);
    assert.equal(cum[0]!.tickLabel, stack[0]!.label);
    assert.equal(cum[1]!.value, 5);
  });

  it("builds pnl stack per trade", () => {
    const rows = [
      entry({ openedAt: "2026-06-10T03:00:00.000Z", pnl: 10, result: "win", symbol: "EURUSD" }),
      entry({ openedAt: "2026-06-11T03:00:00.000Z", pnl: -5, result: "loss", symbol: "XAUUSD" }),
    ];
    const stack = pnlStackPoints(rows, {
      granularity: "trade",
      from: "2026-06-01",
      to: "2026-06-30",
    });
    assert.equal(stack.length, 2);
    assert.match(stack[0]!.label, /^#1/);
  });

  it("builds monthly pnl stack for a calendar year", () => {
    const rows = [
      entry({ openedAt: "2026-06-10T03:00:00.000Z", pnl: 230, result: "win" }),
      entry({ openedAt: "2026-06-12T03:00:00.000Z", pnl: -17, result: "loss" }),
      entry({ openedAt: "2026-01-05T03:00:00.000Z", pnl: 50, result: "win" }),
    ];
    const stack = monthlyPnlStackPoints(rows, 2026);
    assert.equal(stack.length, 12);
    assert.equal(stack[5]?.month, "Jun");
    assert.equal(stack[5]?.wins, 230);
    assert.equal(stack[5]?.losses, 17);
    assert.equal(stack[5]?.net, 213);
    assert.equal(stack[0]?.net, 50);
  });

  it("walks cumulative pnl in openedAt order", () => {
    assert.deepEqual(
      cumulativePnl([
        entry({ openedAt: "2026-09-03T00:00:00.000Z", pnl: 10 }),
        entry({ openedAt: "2026-09-01T00:00:00.000Z", pnl: -4 }),
      ]),
      [-4, 6]
    );
  });

  it("summarizes the local demo set without throwing", () => {
    const snap = summarizeJournal(NOTE_DEMO_ENTRIES);
    assert.ok(snap.tradeCount >= 5);
    assert.deepEqual(snap.byEmotion, []);
    assert.equal(typeof snap.expectancy === "number" || snap.expectancy === null, true);
  });

  it("formats pnl compact, paren losses, and timestamps", () => {
    assert.equal(formatPnl(17), "+Rp17");
    assert.equal(formatPnl(-12000, { compact: true }), "-Rp12 rb");
    assert.equal(formatPnl(-12000, { compact: true, locale: "en" }), "-Rp12k");
    assert.equal(formatPnl(-12, { lossStyle: "paren" }), "(Rp12)");
    assert.equal(formatPnl(1_200_000, { compact: true }), "+Rp1,2 jt");
    assert.equal(formatPnl(1_200_000, { compact: true, locale: "en" }), "+Rp1.2m");
    assert.equal(formatPnl(2_500_000_000, { compact: true }), "+Rp2,5 mld");
    assert.equal(formatPnl(2_500_000_000, { compact: true, locale: "en" }), "+Rp2.5b");
    assert.equal(formatPnl(17, { currency: "USD" }), "+$17");
    assert.equal(formatPnl(17, { currency: "USDT" }), "+17 USDT");
    assert.equal(formatPnl(17, { naked: true }), "+17");
    assert.equal(formatPnl(-12, { naked: true, lossStyle: "paren" }), "(12)");
    assert.equal(formatPnl(1_250_000, { naked: true, compact: true, maxChars: 6 }), "+1,3jt");
    assert.equal(formatPnl(1_250_000, { naked: true, compact: true, maxChars: 6, locale: "en" }), "+1.3m");
    assert.equal(formatPnl(-9876543, { compact: true, maxChars: 7, currency: "USD" }).length <= 9, true);
    assert.equal(formatPnl(-9876543, { compact: true, maxChars: 7, currency: "USD", locale: "en" }), "-$9.9m");
    assert.equal(formatPnl(1_234_567, { compact: false, locale: "en", currency: "USD" }), "+$1,234,567");
    const iso = latestActivityIso([
      entry({ openedAt: "2026-09-01T00:00:00.000Z", createdAt: "2026-09-02T00:00:00.000Z" }),
    ]);
    assert.equal(iso, "2026-09-02T00:00:00.000Z");
    const stamp = formatNoteTimestamp("2026-09-02T03:00:00.000Z", "2026-09-02T04:00:00.000Z", "id");
    assert.equal(stamp.relative, "1 jam lalu");
    assert.match(stamp.absolute, /WIB$/);
    const stampEn = formatNoteTimestamp("2026-09-02T03:00:00.000Z", "2026-09-02T04:00:00.000Z", "en");
    assert.equal(stampEn.relative, "1 hr ago");
  });

  it("builds monthly returns grid from journal PnL", () => {
    const rows = [
      entry({ openedAt: "2026-01-15T03:00:00.000Z", pnl: 1_000_000 }),
      entry({ openedAt: "2026-02-10T03:00:00.000Z", pnl: -500_000 }),
    ];
    const grid = monthlyReturnsGrid(rows, { notional: 10_000_000, spanYears: 1 });
    assert.ok(grid.years.includes(2026));
    const yIdx = grid.years.indexOf(2026);
    assert.equal(grid.returns[yIdx][0], 10);
    assert.equal(grid.returns[yIdx][1], -5);
  });
});
