import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDemoTrackStore } from "../src/lib/note/track/demo-seed";
import { buildTrackSnapshot } from "../src/lib/note/track/engine";
import { convertMoney } from "../src/lib/note/fx/convert";
import { parseUsdIdrFromYahooChart, usdIdrRateNeedsRefresh } from "../src/lib/note/fx/usd-idr-spot";
import { entryPnlInDisplay, inferJournalCurrency } from "../src/lib/note/fx/journal";
import { summarizeJournal } from "../src/lib/note/stats";

describe("Note FX", () => {
  it("parses USD/IDR from Yahoo chart meta", () => {
    const rate = parseUsdIdrFromYahooChart({
      chart: { result: [{ meta: { regularMarketPrice: 16_234.5 } }] },
    });
    assert.equal(rate, 16235);
  });

  it("refresh when never fetched and not manual", () => {
    assert.equal(usdIdrRateNeedsRefresh(undefined, false), true);
    assert.equal(usdIdrRateNeedsRefresh(undefined, true), false);
  });

  it("converts USD to IDR with spot rate", () => {
    assert.equal(convertMoney(100, "USD", "IDR", { usdIdr: 15_000 }), 1_500_000);
    assert.equal(convertMoney(1_500_000, "IDR", "USD", { usdIdr: 15_000 }), 100);
  });

  it("infers journal currency from symbol", () => {
    assert.equal(inferJournalCurrency("EURUSD"), "USD");
    assert.equal(inferJournalCurrency("BBCA"), "IDR");
  });

  it("aggregates mixed journal pnl in display currency", () => {
    const snap = summarizeJournal(
      [
        {
          id: "1",
          apexUserId: "u",
          kind: "TRADE",
          mode: "cepat",
          symbol: "EURUSD",
          side: "BUY",
          qty: 0.1,
          entryPrice: null,
          exitPrice: null,
          fees: 0,
          currency: "USD",
          pnl: 100,
          result: "win",
          emotion: null,
          note: null,
          ruleBroken: null,
          lesson: null,
          clinicModuleId: null,
          protocol: null,
          accountLabel: null,
          relatedCourseSlug: null,
          relatedLessonId: null,
          openedAt: "2026-09-01T10:00:00+07:00",
          createdAt: "2026-09-01T10:00:00+07:00",
        },
        {
          id: "2",
          apexUserId: "u",
          kind: "TRADE",
          mode: "cepat",
          symbol: "BBCA",
          side: "BUY",
          qty: 10,
          entryPrice: null,
          exitPrice: null,
          fees: 0,
          currency: "IDR",
          pnl: -50_000,
          result: "loss",
          emotion: null,
          note: null,
          ruleBroken: null,
          lesson: null,
          clinicModuleId: null,
          protocol: null,
          accountLabel: null,
          relatedCourseSlug: null,
          relatedLessonId: null,
          openedAt: "2026-09-02T10:00:00+07:00",
          createdAt: "2026-09-02T10:00:00+07:00",
        },
      ],
      { display: "IDR", rates: { usdIdr: 10_000 } }
    );
    assert.equal(snap.pnlSum, 100 * 10_000 - 50_000);
  });

  it("demo track all-portfolios total uses FX in IDR base", () => {
    const store = buildDemoTrackStore();
    const idr = buildTrackSnapshot(store.transactions, {
      range: "all",
      baseCurrency: "IDR",
      rates: { usdIdr: 15_850 },
    });
    const usd = buildTrackSnapshot(store.transactions, {
      range: "all",
      baseCurrency: "USD",
      rates: { usdIdr: 15_850 },
    });
    assert.ok(idr.totalValue > usd.totalValue * 1000);
    assert.equal(idr.mixedCurrencies, true);
  });

  it("entryPnlInDisplay respects stored currency", () => {
    assert.equal(
      entryPnlInDisplay({ pnl: 10, symbol: "BBCA", currency: "USD" }, "IDR", { usdIdr: 15_000 }),
      150_000
    );
  });
});
