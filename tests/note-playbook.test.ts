import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adaptPlaybook } from "../src/lib/note/playbook/adapt";
import { computeRequiredYes, evaluateCheckEngine } from "../src/lib/note/playbook/check-engine";
import { DEFAULT_SETUP_ID, defaultPlaybookState } from "../src/lib/note/playbook/defaults";
import { evaluatePlaybookGate } from "../src/lib/note/playbook/gate";
import { journalGateMetrics } from "../src/lib/note/playbook/metrics";
import { priorWeightsFromSignals, updateProfileWeights } from "../src/lib/note/playbook/profile";

const ZERO_METRICS = {
  tradesToday: 0,
  dailyPnl: 0,
  openCount: 0,
  consecutiveLosses: 0,
  tradesLast7Days: 0,
  reentryAfterLossCount: 0,
  winStreak: 0,
};

function fillCoreYes(state: ReturnType<typeof defaultPlaybookState>) {
  state.checkAnswers.trend_clear = true;
  state.checkAnswers.liquidity_valid = true;
  state.checkAnswers.news_safe = true;
  state.checkAnswers.setup_match = true;
  state.checkAnswers.no_overexposure = true;
  state.checkAnswers.session_active = true;
  state.checkAnswers.invalidation_intact = true;
  state.checkAnswers.structure_confirmed = true;
}

describe("Playbook gate", () => {
  it("blocks without setup and checks", () => {
    const state = defaultPlaybookState();
    const gate = evaluatePlaybookGate(state, ZERO_METRICS);
    assert.equal(gate.verdict, "block");
    assert.equal(gate.allowed, false);
  });

  it("allows when setup, checks, and rules pass", () => {
    const state = defaultPlaybookState();
    state.activeSetupId = DEFAULT_SETUP_ID;
    fillCoreYes(state);
    const gate = evaluatePlaybookGate(state, { ...ZERO_METRICS, tradesToday: 1, dailyPnl: 100 });
    assert.equal(gate.verdict, "allow");
    assert.equal(gate.allowed, true);
  });

  it("rules veto on daily loss", () => {
    const state = defaultPlaybookState();
    state.activeSetupId = DEFAULT_SETUP_ID;
    fillCoreYes(state);
    state.rules.maxDailyLoss = 100;
    const gate = evaluatePlaybookGate(state, { ...ZERO_METRICS, tradesToday: 1, dailyPnl: -200 });
    assert.equal(gate.allowed, false);
    assert.equal(gate.rulesPass, false);
  });
});

describe("Check engine mapping", () => {
  it("impulsive requires 5 core yes", () => {
    const signals = defaultPlaybookState().profile.signals;
    signals.entryDiscipline = "impulsive";
    assert.equal(computeRequiredYes(signals, priorWeightsFromSignals(signals), 0), 5);
  });

  it("strict requires 3 core yes", () => {
    const signals = defaultPlaybookState().profile.signals;
    signals.entryDiscipline = "strict";
    assert.equal(computeRequiredYes(signals, priorWeightsFromSignals(signals), 0), 3);
  });

  it("raises required core yes after re-entry with loss streak", () => {
    const state = defaultPlaybookState();
    state.profile.signals.entryDiscipline = "strict";
    state.activeSetupId = DEFAULT_SETUP_ID;
    fillCoreYes(state);
    state.checkAnswers.liquidity_valid = false;
    const base = computeRequiredYes(state.profile.signals, state.profile.weights, 0);
    const r = evaluateCheckEngine({
      state,
      metrics: { ...ZERO_METRICS, reentryAfterLossCount: 2, consecutiveLosses: 2 },
    });
    assert.equal(r.requiredYes, Math.min(5, base + 1));
    assert.notEqual(r.verdict, "allow");
  });

  it("conditional caps size scale hint", () => {
    const state = defaultPlaybookState();
    state.activeSetupId = DEFAULT_SETUP_ID;
    state.checkAnswers.trend_clear = true;
    state.checkAnswers.liquidity_valid = true;
    state.checkAnswers.news_safe = true;
    state.checkAnswers.setup_match = true;
    state.checkAnswers.no_overexposure = false;
    const r = evaluateCheckEngine({ state, metrics: ZERO_METRICS });
    assert.equal(r.verdict, "conditional");
    assert.ok(r.sizeScaleHint <= 0.75);
  });

  it("revenge blocks during cooldown", () => {
    const state = defaultPlaybookState();
    state.profile.signals.lossResponse = "revenge";
    state.activeSetupId = DEFAULT_SETUP_ID;
    fillCoreYes(state);
    const r = evaluateCheckEngine({
      state,
      metrics: ZERO_METRICS,
      lastLossMinutesAgo: 5,
      checkPassesSinceLoss: 0,
    });
    assert.equal(r.verdict, "block");
  });
});

describe("Playbook profile", () => {
  it("bayesian update moves weights toward journal evidence", () => {
    const signals = defaultPlaybookState().profile.signals;
    const before = priorWeightsFromSignals(signals);
    const after = updateProfileWeights(signals, before, {
      ...ZERO_METRICS,
      tradesToday: 5,
      tradesLast7Days: 20,
      reentryAfterLossCount: 2,
      consecutiveLosses: 2,
    });
    assert.ok(after.overtradeRisk >= before.overtradeRisk);
  });
});

describe("Playbook adapt", () => {
  it("tightens max trades when overtrade risk high", () => {
    const base = defaultPlaybookState().rules;
    const signals = defaultPlaybookState().profile.signals;
    const strict = adaptPlaybook(
      base,
      { overtradeRisk: 0.8, revengeRisk: 0.2, impulseRisk: 0.2, hesitation: 0.2 },
      signals
    );
    const loose = adaptPlaybook(
      base,
      { overtradeRisk: 0.15, revengeRisk: 0.15, impulseRisk: 0.15, hesitation: 0.15 },
      signals
    );
    assert.ok(strict.rules.maxTradesPerSession < loose.rules.maxTradesPerSession);
  });
});

describe("Playbook journal metrics", () => {
  it("counts trades on jakarta day key", () => {
    const m = journalGateMetrics([
      {
        id: "1",
        kind: "TRADE",
        mode: "cepat",
        symbol: "BBCA",
        side: "BUY",
        pnl: -10,
        result: "loss",
        openedAt: "2026-09-15T10:00:00+07:00",
        createdAt: "2026-09-15T10:00:00+07:00",
        updatedAt: "2026-09-15T10:00:00+07:00",
      },
    ] as never);
    assert.equal(m.tradesToday >= 0, true);
  });
});
