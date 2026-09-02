import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOTE_DEMO_ENTRIES } from "../src/lib/note/demo-entries";
import {
  cumulativePnl,
  dayKey,
  filterEntries,
  groupByEmotion,
  groupBySymbol,
  inferJournalResult,
  loggingStreak,
  sundayIndex,
  weekPad,
  weekdayLabels,
  monthBuckets,
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
    assert.deepEqual([...weekdayLabels("sunday")], ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]);
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

  it("groups symbol and emotion with win rate", () => {
    const rows = [
      entry({ symbol: "BBCA", emotion: "tenang", pnl: 20, result: "win" }),
      entry({ id: "2", symbol: "BBCA", emotion: "FOMO", pnl: -5, result: "loss" }),
      entry({ id: "3", symbol: "ETH", emotion: "tenang", pnl: 10, result: "win" }),
    ];
    const symbols = groupBySymbol(rows);
    assert.equal(symbols[0].key, "BBCA");
    assert.equal(symbols[0].net, 15);
    assert.equal(symbols[0].count, 2);
    assert.equal(symbols[0].winRate, 0.5);
    const emotions = groupByEmotion(rows);
    assert.equal(emotions.find((e) => e.key === "tenang")?.net, 30);
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
    assert.ok(snap.byEmotion.length > 0);
    assert.equal(typeof snap.expectancy === "number" || snap.expectancy === null, true);
  });

  it("formats pnl compact, paren losses, and timestamps", () => {
    assert.equal(formatPnl(17), "+Rp17");
    assert.equal(formatPnl(-12000, { compact: true }), "-Rp12 rb");
    assert.equal(formatPnl(-12, { lossStyle: "paren" }), "(Rp12)");
    assert.equal(formatPnl(1_200_000, { compact: true }), "+Rp1,2 jt");
    assert.equal(formatPnl(17, { currency: "USD" }), "+$17");
    assert.equal(formatPnl(17, { currency: "USDT" }), "+17 USDT");
    assert.equal(formatPnl(17, { naked: true }), "+17");
    assert.equal(formatPnl(-12, { naked: true, lossStyle: "paren" }), "(12)");
    const iso = latestActivityIso([
      entry({ openedAt: "2026-09-01T00:00:00.000Z", createdAt: "2026-09-02T00:00:00.000Z" }),
    ]);
    assert.equal(iso, "2026-09-02T00:00:00.000Z");
    const stamp = formatNoteTimestamp("2026-09-02T03:00:00.000Z", "2026-09-02T04:00:00.000Z");
    assert.equal(stamp.relative, "1 jam lalu");
    assert.match(stamp.absolute, /WIB$/);
  });
});
