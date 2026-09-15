import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyPlaybookSuggestion } from "../src/lib/note/analytics/apply";
import { buildAnalyticsReport } from "../src/lib/note/analytics/engine";
import { assetBucket, tradingSessionFromIso } from "../src/lib/note/analytics/session";
import { defaultPlaybookState } from "../src/lib/note/playbook/defaults";
import type { JournalEntry } from "../src/lib/note/types";

let tradeSeq = 0;
function trade(partial: Partial<JournalEntry> & Pick<JournalEntry, "openedAt">): JournalEntry {
  tradeSeq += 1;
  const openedAt = partial.openedAt;
  return {
    id: partial.id ?? `t-${tradeSeq}`,
    apexUserId: "test",
    kind: partial.kind ?? "TRADE",
    mode: partial.mode ?? "cepat",
    symbol: partial.symbol ?? "XAUUSD",
    side: partial.side ?? "long",
    qty: partial.qty ?? null,
    entryPrice: partial.entryPrice ?? null,
    exitPrice: partial.exitPrice ?? null,
    fees: partial.fees ?? null,
    openedAt,
    createdAt: partial.createdAt ?? openedAt,
    result: partial.result ?? "win",
    pnl: partial.pnl ?? 100,
    emotion: partial.emotion ?? null,
    ruleBroken: partial.ruleBroken ?? null,
    note: partial.note ?? null,
    lesson: partial.lesson ?? null,
    clinicModuleId: partial.clinicModuleId ?? null,
    protocol: partial.protocol ?? null,
    accountLabel: partial.accountLabel ?? null,
    relatedCourseSlug: partial.relatedCourseSlug ?? null,
    relatedLessonId: partial.relatedLessonId ?? null,
  };
}

describe("Analytics session + asset", () => {
  it("maps WIB hour to session bucket", () => {
    assert.equal(tradingSessionFromIso("2026-01-15T10:00:00+07:00"), "asia");
    assert.equal(tradingSessionFromIso("2026-01-15T16:00:00+07:00"), "london");
    assert.equal(tradingSessionFromIso("2026-01-15T22:00:00+07:00"), "new_york");
  });

  it("buckets symbols", () => {
    assert.equal(assetBucket("XAUUSD"), "XAU");
    assert.equal(assetBucket("BTCUSDT"), "BTC");
  });
});

describe("Analytics engine", () => {
  it("detects revenge leakage after loss", () => {
    const entries = [
      trade({ openedAt: "2026-03-01T10:00:00+07:00", result: "loss", pnl: -50 }),
      trade({ openedAt: "2026-03-01T10:20:00+07:00", result: "loss", pnl: -30 }),
      trade({ openedAt: "2026-03-01T10:40:00+07:00", result: "loss", pnl: -20 }),
      trade({ openedAt: "2026-03-01T11:00:00+07:00", result: "win", pnl: 20 }),
    ];
    const report = buildAnalyticsReport(entries);
    assert.ok(report.leakage.some((l) => l.id === "revenge"));
  });

  it("builds edge rows with min sample", () => {
    const entries = [
      trade({ openedAt: "2026-03-01T10:00:00+07:00", symbol: "EURUSD", pnl: 10, result: "win" }),
      trade({ openedAt: "2026-03-02T10:00:00+07:00", symbol: "EURUSD", pnl: 10, result: "win" }),
      trade({ openedAt: "2026-03-03T10:00:00+07:00", symbol: "EURUSD", pnl: -5, result: "loss" }),
    ];
    const report = buildAnalyticsReport(entries);
    assert.equal(report.edge.symbols.length, 1);
    assert.equal(report.edge.symbols[0].label, "EURUSD");
  });

  it("suggests playbook patch for overtrade leakage", () => {
    const entries: JournalEntry[] = [];
    for (let d = 0; d < 2; d += 1) {
      for (let i = 0; i < 4; i += 1) {
        entries.push(
          trade({
            openedAt: `2026-03-${String(d + 1).padStart(2, "0")}T${String(10 + i).padStart(2, "0")}:00:00+07:00`,
            pnl: -10,
            result: "loss",
          })
        );
      }
    }
    const report = buildAnalyticsReport(entries, {
      weights: { overtradeRisk: 0.6, revengeRisk: 0.2, impulseRisk: 0.2, hesitation: 0.2 },
    });
    assert.ok(report.suggestions.some((s) => s.id === "tighten-trades"));
    const freq = report.suggestions.find((s) => s.id === "freq-high");
    assert.ok(freq);
    assert.equal(freq!.patch.signal?.tradeFrequency, "high");
    assert.equal(freq!.patch.rules?.maxTradesPerSession, 2);
  });
});

describe("Apply playbook suggestion", () => {
  it("merges rules and signals", () => {
    const state = defaultPlaybookState();
    const next = applyPlaybookSuggestion(state, {
      id: "test",
      title: { id: "t", en: "t" },
      detail: { id: "d", en: "d" },
      patch: { rules: { maxTradesPerSession: 2 }, signal: { lossResponse: "revenge" } },
    });
    assert.equal(next.rules.maxTradesPerSession, 2);
    assert.equal(next.profile.signals.lossResponse, "revenge");
  });
});
