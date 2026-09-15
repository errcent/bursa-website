import type {
  BehaviorRiskWeights,
  BehaviorSignals,
  JournalGateMetrics,
  PlaybookProfile,
} from "@/lib/note/playbook/types";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Prior from user-facing signals (not labels). */
export function priorWeightsFromSignals(signals: BehaviorSignals): BehaviorRiskWeights {
  const freqMap = { low: 0.22, medium: 0.42, high: 0.68 } as const;
  const lossMap = { stable: 0.2, revenge: 0.72, overcorrect: 0.48 } as const;
  const discMap = { strict: 0.18, mixed: 0.45, impulsive: 0.7 } as const;
  const confMap = { stable: 0.22, overconfident: 0.38, underconfident: 0.62 } as const;

  return {
    overtradeRisk: freqMap[signals.tradeFrequency],
    revengeRisk: lossMap[signals.lossResponse],
    impulseRisk: discMap[signals.entryDiscipline],
    hesitation: confMap[signals.confidenceShift],
  };
}

function bayesianStep(prior: number, likelihood: number, strength = 0.32): number {
  return clamp01(prior * (1 - strength) + likelihood * strength);
}

/** Journal evidence → likelihood per risk dimension. */
export function likelihoodFromJournal(metrics: JournalGateMetrics): BehaviorRiskWeights {
  const weeklyPace = metrics.tradesLast7Days / 7;
  let overtrade = 0.25;
  if (weeklyPace >= 3) overtrade = 0.85;
  else if (weeklyPace >= 1.5) overtrade = 0.55;
  else if (weeklyPace <= 0.4) overtrade = 0.15;

  if (metrics.tradesToday >= 4) overtrade = Math.max(overtrade, 0.82);

  let revenge = 0.2;
  if (metrics.reentryAfterLossCount >= 2) revenge = 0.78;
  else if (metrics.reentryAfterLossCount >= 1) revenge = 0.55;
  if (metrics.consecutiveLosses >= 2 && metrics.tradesToday >= 2) revenge = Math.max(revenge, 0.72);

  let impulse = 0.25;
  if (metrics.tradesToday >= 3 && metrics.consecutiveLosses >= 1) impulse = 0.7;
  if (metrics.openCount >= 2) impulse = Math.max(impulse, 0.58);

  let hesitation = 0.2;
  if (metrics.tradesLast7Days <= 2 && metrics.consecutiveLosses >= 1) hesitation = 0.65;
  if (metrics.tradesToday === 0 && metrics.tradesLast7Days >= 5) hesitation = Math.max(hesitation, 0.45);

  return { overtradeRisk: overtrade, revengeRisk: revenge, impulseRisk: impulse, hesitation };
}

export function updateProfileWeights(
  signals: BehaviorSignals,
  stored: BehaviorRiskWeights | undefined,
  metrics: JournalGateMetrics
): BehaviorRiskWeights {
  const prior = stored ?? priorWeightsFromSignals(signals);
  const like = likelihoodFromJournal(metrics);

  return {
    overtradeRisk: bayesianStep(prior.overtradeRisk, like.overtradeRisk),
    revengeRisk: bayesianStep(prior.revengeRisk, like.revengeRisk),
    impulseRisk: bayesianStep(prior.impulseRisk, like.impulseRisk),
    hesitation: bayesianStep(prior.hesitation, like.hesitation),
  };
}

export function defaultProfile(): PlaybookProfile {
  const signals: BehaviorSignals = {
    tradeFrequency: "medium",
    lossResponse: "stable",
    entryDiscipline: "mixed",
    confidenceShift: "stable",
  };
  return {
    signals,
    weights: priorWeightsFromSignals(signals),
    updatedAt: null,
    onboardingCompleted: false,
  };
}

export function synthesizeProfile(
  profile: PlaybookProfile,
  metrics: JournalGateMetrics
): PlaybookProfile {
  const weights = updateProfileWeights(profile.signals, profile.weights, metrics);
  return {
    ...profile,
    weights,
    updatedAt: new Date().toISOString(),
  };
}
