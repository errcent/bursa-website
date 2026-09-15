import { PLAYBOOK_CHECKS } from "@/lib/note/playbook/defaults";
import type {
  AdaptedPlaybook,
  BehaviorRiskWeights,
  BehaviorSignals,
  PlaybookCheckId,
  PlaybookRulesConfig,
} from "@/lib/note/playbook/types";

const BASE_CHECKS: PlaybookCheckId[] = [
  "trend_clear",
  "liquidity_valid",
  "news_safe",
  "setup_match",
  "no_overexposure",
];

export function adaptPlaybook(
  baseRules: PlaybookRulesConfig,
  weights: BehaviorRiskWeights,
  signals: BehaviorSignals,
  winStreak = 0
): AdaptedPlaybook {
  const { overtradeRisk, revengeRisk, impulseRisk, hesitation } = weights;

  let strictScore = overtradeRisk * 0.35 + revengeRisk * 0.25 + impulseRisk * 0.35 - hesitation * 0.15;
  if (signals.tradeFrequency === "high") strictScore += 0.15;
  if (signals.tradeFrequency === "low") strictScore -= 0.1;
  if (signals.confidenceShift === "overconfident" && winStreak >= 3) strictScore += 0.2;

  const intensity: AdaptedPlaybook["intensity"] =
    strictScore >= 0.52 ? "strict" : strictScore <= 0.28 ? "relaxed" : "balanced";

  const maxTrades = Math.max(
    1,
    Math.round(
      baseRules.maxTradesPerSession *
        (1 - overtradeRisk * 0.45) *
        (signals.tradeFrequency === "high" ? 0.75 : 1)
    )
  );

  const blockNews = Math.round(
    baseRules.blockMinutesBeforeHighImpact +
      revengeRisk * 25 +
      overtradeRisk * 10 +
      (signals.lossResponse === "revenge" ? 10 : 0)
  );

  const stopLosses = Math.max(
    2,
    Math.round(baseRules.stopAfterConsecutiveLosses - hesitation * 0.8 + overtradeRisk * 0.5)
  );

  let riskPct = baseRules.maxRiskPerTradePct;
  riskPct *= 1 - overtradeRisk * 0.35 - impulseRisk * 0.2;
  if (signals.confidenceShift === "overconfident") riskPct *= 0.85;
  if (winStreak >= 3 && signals.confidenceShift === "overconfident") riskPct *= 0.9;
  riskPct = Math.max(0.25, riskPct);

  const dailyLoss = Math.max(1, Math.round(baseRules.maxDailyLoss * (1 - revengeRisk * 0.25)));

  let cooldown = baseRules.cooldownMinutesAfterLoss;
  if (signals.lossResponse === "revenge") {
    cooldown = Math.max(cooldown, Math.round(15 + revengeRisk * 45));
  } else if (revengeRisk >= 0.55 || impulseRisk >= 0.55) {
    cooldown = Math.max(cooldown, Math.round(15 + revengeRisk * 30));
  }

  const activeCheckIds = [...BASE_CHECKS];
  if (signals.entryDiscipline === "impulsive" || impulseRisk >= 0.5) {
    activeCheckIds.push("structure_confirmed", "invalidation_intact");
  } else if (signals.tradeFrequency === "high") {
    activeCheckIds.push("session_active", "invalidation_intact");
  }

  const minChecksRequired = activeCheckIds.length;

  return {
    rules: {
      ...baseRules,
      maxTradesPerSession: maxTrades,
      blockMinutesBeforeHighImpact: blockNews,
      stopAfterConsecutiveLosses: stopLosses,
      maxRiskPerTradePct: Math.round(riskPct * 100) / 100,
      maxDailyLoss: dailyLoss,
      cooldownMinutesAfterLoss: cooldown,
    },
    activeCheckIds: [...new Set(activeCheckIds)],
    minChecksRequired,
    intensity,
  };
}

export function activeCheckDefs(ids: PlaybookCheckId[]) {
  return PLAYBOOK_CHECKS.filter((c) => ids.includes(c.id));
}
