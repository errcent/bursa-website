import { adaptPlaybook } from "@/lib/note/playbook/adapt";
import type {
  AdaptedPlaybook,
  BehaviorSignals,
  JournalGateMetrics,
  PlaybookCheckId,
  PlaybookPersisted,
} from "@/lib/note/playbook/types";

export type GateVerdict = "allow" | "conditional" | "block";

/** Five core gates (Playbook CHECK contract). */
export const CORE_CHECK_IDS: PlaybookCheckId[] = [
  "trend_clear",
  "liquidity_valid",
  "news_safe",
  "setup_match",
  "no_overexposure",
];

const CRITICAL: PlaybookCheckId[] = ["trend_clear", "news_safe", "setup_match"];

export type CheckEngineInput = {
  state: PlaybookPersisted;
  metrics: JournalGateMetrics;
  highImpactWithinMinutes?: number | null;
  lastLossMinutesAgo?: number | null;
  winStreak?: number;
  checkPassesSinceLoss?: number;
};

export type CheckEngineResult = {
  verdict: GateVerdict;
  adapted: AdaptedPlaybook;
  requiredYes: number;
  coreYes: number;
  coreTotal: number;
  allActiveYes: number;
  setupSelected: boolean;
  rulesPass: boolean;
  checksComplete: boolean;
  blockers: Record<"id" | "en", string>[];
  warnings: Record<"id" | "en", string>[];
  sizeScaleHint: number;
};

function msg(id: string, en: string) {
  return { id, en };
}

function disciplineRequiredYes(discipline: BehaviorSignals["entryDiscipline"]): number {
  if (discipline === "impulsive") return 5;
  if (discipline === "mixed") return 4;
  return 3;
}

function revengeCooldownMinutes(signals: BehaviorSignals, revengeRisk: number): number {
  if (signals.lossResponse !== "revenge") return 0;
  return Math.round(15 + revengeRisk * 45);
}

export function computeRequiredYes(
  signals: BehaviorSignals,
  weights: PlaybookPersisted["profile"]["weights"],
  winStreak: number
): number {
  let required = disciplineRequiredYes(signals.entryDiscipline);

  if (signals.tradeFrequency === "high") {
    required = CORE_CHECK_IDS.length;
  } else if (signals.tradeFrequency === "low") {
    required = Math.max(3, required - 1);
  }

  if (signals.confidenceShift === "overconfident" && winStreak >= 3) {
    required = Math.min(CORE_CHECK_IDS.length, required + 1);
  }

  if (weights.overtradeRisk >= 0.6) {
    required = Math.min(CORE_CHECK_IDS.length, required + 1);
  }

  return required;
}

export function evaluateCheckEngine(input: CheckEngineInput): CheckEngineResult {
  const { state, metrics } = input;
  const signals = state.profile.signals;
  const weights = state.profile.weights;
  const adapted = adaptPlaybook(state.rules, weights, signals, input.winStreak ?? 0);
  const blockers: CheckEngineResult["blockers"] = [];
  const warnings: CheckEngineResult["warnings"] = [];

  const active = state.setups.find((s) => s.id === state.activeSetupId && s.enabled);
  const setupSelected = Boolean(active);
  if (!setupSelected) {
    blockers.push(msg("Pilih setup aktif.", "Select an active setup."));
  }

  const { rules } = adapted;
  let rulesPass = true;

  if (metrics.tradesToday >= rules.maxTradesPerSession) {
    rulesPass = false;
    blockers.push(msg("RISK: max trade/sesi tercapai.", "RISK: max trades per session reached."));
  }
  if (metrics.dailyPnl <= -Math.abs(rules.maxDailyLoss)) {
    rulesPass = false;
    blockers.push(msg("RISK: max loss harian.", "RISK: daily loss limit."));
  }
  if (metrics.consecutiveLosses >= rules.stopAfterConsecutiveLosses) {
    rulesPass = false;
    blockers.push(msg("RISK: streak loss stop.", "RISK: loss streak stop."));
  }

  const newsMins = input.highImpactWithinMinutes;
  if (newsMins != null && newsMins >= 0 && newsMins <= rules.blockMinutesBeforeHighImpact) {
    rulesPass = false;
    blockers.push(
      msg(`RISK: news high-impact ~${Math.ceil(newsMins)} menit.`, `RISK: high-impact news ~${Math.ceil(newsMins)} min.`)
    );
  }

  const revengeCd = revengeCooldownMinutes(signals, weights.revengeRisk);
  const lossAgo = input.lastLossMinutesAgo;
  if (signals.lossResponse === "revenge" && lossAgo != null && lossAgo >= 0 && lossAgo < revengeCd) {
    rulesPass = false;
    blockers.push(
      msg(
        `CHECK: cooldown ${revengeCd} menit setelah loss (revenge profile).`,
        `CHECK: ${revengeCd} min cooldown after loss (revenge profile).`
      )
    );
  }

  if (
    signals.lossResponse === "revenge" &&
    lossAgo != null &&
    lossAgo < 24 * 60 &&
    (input.checkPassesSinceLoss ?? 0) < 2
  ) {
    rulesPass = false;
    blockers.push(
      msg(
        "CHECK: butuh 2 siklus CHECK penuh setelah loss.",
        "CHECK: need 2 full CHECK cycles after a loss."
      )
    );
  }

  if (rules.cooldownMinutesAfterLoss > 0 && lossAgo != null && lossAgo >= 0 && lossAgo < rules.cooldownMinutesAfterLoss) {
    rulesPass = false;
    blockers.push(
      msg(
        `RISK: cooldown ${rules.cooldownMinutesAfterLoss} menit.`,
        `RISK: ${rules.cooldownMinutesAfterLoss} min cooldown.`
      )
    );
  }

  let sizeScaleHint = 1;
  if (signals.lossResponse === "overcorrect" && lossAgo != null && lossAgo < 180) {
    sizeScaleHint = 0.65;
    warnings.push(
      msg("Setelah loss: kurangi size (~65%).", "After a loss: reduce size (~65%).")
    );
  }
  if (signals.confidenceShift === "overconfident") {
    sizeScaleHint = Math.min(sizeScaleHint, 0.85);
  }

  let requiredYes = computeRequiredYes(signals, weights, input.winStreak ?? 0);
  if (metrics.reentryAfterLossCount >= 1 && metrics.consecutiveLosses >= 1) {
    requiredYes = Math.min(CORE_CHECK_IDS.length, requiredYes + 1);
  }
  if (metrics.tradesToday >= 2 && weights.impulseRisk >= 0.55) {
    requiredYes = Math.min(CORE_CHECK_IDS.length, requiredYes + 1);
  }
  const activeIds = adapted.activeCheckIds;

  let checksComplete = true;
  let coreYes = 0;
  let allActiveYes = 0;

  for (const id of CORE_CHECK_IDS) {
    const answer = state.checkAnswers[id];
    if (answer === undefined) checksComplete = false;
    else if (answer) coreYes += 1;
  }

  for (const id of activeIds) {
    if (!CORE_CHECK_IDS.includes(id)) {
      const answer = state.checkAnswers[id];
      if (answer === undefined) checksComplete = false;
      else if (answer) allActiveYes += 1;
    }
  }
  allActiveYes += coreYes;

  for (const id of CRITICAL) {
    if (state.checkAnswers[id] === false) {
      blockers.push(msg(`CHECK kritis gagal: ${id}.`, `Critical CHECK failed: ${id}.`));
    }
  }

  if (!checksComplete) {
    blockers.push(msg("Lengkapi semua CHECK.", "Complete all CHECK items."));
  }

  if (signals.tradeFrequency === "high") {
    for (const id of activeIds) {
      if (state.checkAnswers[id] === false) {
        blockers.push(msg("FREQ tinggi: semua CHECK harus YA.", "High frequency: all CHECK must be YES."));
        break;
      }
    }
  }

  let verdict: GateVerdict = "block";

  const criticalOk = CRITICAL.every((id) => state.checkAnswers[id] !== false);
  const meetsCore = coreYes >= requiredYes;

  if (!rulesPass || !setupSelected || !checksComplete || !criticalOk) {
    verdict = "block";
  } else if (meetsCore && coreYes === CORE_CHECK_IDS.length && (signals.tradeFrequency !== "high" || allActiveYes >= activeIds.length)) {
    verdict = "allow";
  } else if (meetsCore) {
    verdict = "conditional";
    sizeScaleHint = Math.min(sizeScaleHint, 0.75);
    warnings.push(
      msg("Kondisi cukup, tapi belum semua konfirmasi.", "Conditions OK, but not all confirmations.")
    );
  } else if (coreYes >= requiredYes - 1 && criticalOk) {
    verdict = "conditional";
    sizeScaleHint = Math.min(sizeScaleHint, 0.65);
    warnings.push(
      msg("Hampir lolos CHECK. Review sebelum entry.", "Near CHECK pass. Review before entry.")
    );
  } else {
    blockers.push(
      msg(`CHECK: butuh ${requiredYes}/${CORE_CHECK_IDS.length} YA (core).`, `CHECK: need ${requiredYes}/${CORE_CHECK_IDS.length} core YES.`)
    );
  }

  return {
    verdict,
    adapted,
    requiredYes,
    coreYes,
    coreTotal: CORE_CHECK_IDS.length,
    allActiveYes,
    setupSelected,
    rulesPass,
    checksComplete,
    blockers,
    warnings,
    sizeScaleHint,
  };
}
