import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adherenceOf,
  parseAdherenceSnapshot,
  snapshotPlaybook,
  summarizeAdherence,
} from "../src/lib/note/playbook/adherence";
import { defaultProfile } from "../src/lib/note/playbook/profile";
import type { PlaybookPersisted } from "../src/lib/note/playbook/types";
import type { JournalEntry } from "../src/lib/note/types";

function playbook(): PlaybookPersisted {
  return {
    version: 2,
    profile: defaultProfile(),
    activeSetupId: "primary",
    setups: [],
    checkAnswers: { trend_clear: true, news_safe: true, setup_match: true },
    rules: {
      maxRiskPerTradePct: 1,
      maxDailyLoss: 100,
      maxTradesPerSession: 5,
      blockMinutesBeforeHighImpact: 30,
      stopAfterConsecutiveLosses: 3,
      cooldownMinutesAfterLoss: 0,
    },
    gateSession: { lastLossOpenedAt: null, checkPassesSinceLoss: 0 },
  };
}

let seq = 0;
function entry(partial: Partial<JournalEntry>): JournalEntry {
  seq += 1;
  const pnl = partial.pnl ?? 0;
  return {
    id: `a${seq}`,
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

describe("playbook adherence", () => {
  it("snapshots compactly and round-trips", () => {
    const snap = snapshotPlaybook(playbook());
    assert.ok(snap.length < 400);
    const parsed = parseAdherenceSnapshot(snap)!;
    assert.ok(parsed);
    assert.equal(parsed.s, "primary");
    assert.deepEqual([...parsed.y].sort(), ["news_safe", "setup_match", "trend_clear"]);
    assert.equal(parseAdherenceSnapshot("not-json{"), null);
    assert.equal(parseAdherenceSnapshot(null), null);
  });

  it("scores followed only when all critical checks pass", () => {
    const followed = adherenceOf(entry({ protocol: snapshotPlaybook(playbook()) }));
    assert.equal(followed.followed, true);
    assert.equal(followed.score, 1);
    const loose = playbook();
    loose.checkAnswers = { trend_clear: true, news_safe: false, setup_match: true, session_active: true };
    const broken = adherenceOf(entry({ protocol: snapshotPlaybook(loose) }));
    assert.equal(broken.followed, false);
    assert.equal(broken.score, 0.75);
    assert.equal(adherenceOf(entry({})).score, null);
  });

  it("separates followed vs broken performance", () => {
    const good = snapshotPlaybook(playbook());
    const loose = playbook();
    loose.checkAnswers = { trend_clear: false };
    const bad = snapshotPlaybook(loose);
    const summary = summarizeAdherence([
      entry({ pnl: 50, protocol: good }),
      entry({ pnl: -20, protocol: bad }),
      entry({ pnl: 5 }),
    ]);
    assert.equal(summary.followed.trades, 1);
    assert.equal(summary.followed.net, 50);
    assert.equal(summary.broken.trades, 1);
    assert.equal(summary.broken.net, -20);
    assert.equal(summary.unscored, 1);
    assert.equal(summary.adherenceRate, 0.5);
  });
});
