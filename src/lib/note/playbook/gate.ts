import { evaluateCheckEngine, type GateVerdict } from "@/lib/note/playbook/check-engine";
import type { JournalGateMetrics, PlaybookGateResult, PlaybookPersisted } from "@/lib/note/playbook/types";

export type { GateVerdict };

export function evaluatePlaybookGate(
  state: PlaybookPersisted,
  metrics: JournalGateMetrics,
  opts?: {
    highImpactWithinMinutes?: number | null;
    lastLossMinutesAgo?: number | null;
    winStreak?: number;
    checkPassesSinceLoss?: number;
  }
): PlaybookGateResult {
  const engine = evaluateCheckEngine({
    state,
    metrics,
    highImpactWithinMinutes: opts?.highImpactWithinMinutes,
    lastLossMinutesAgo: opts?.lastLossMinutesAgo,
    winStreak: opts?.winStreak ?? 0,
    checkPassesSinceLoss: opts?.checkPassesSinceLoss ?? state.gateSession?.checkPassesSinceLoss ?? 0,
  });

  const allowed = engine.verdict === "allow";
  const checksPass = engine.verdict === "allow" || engine.verdict === "conditional";

  return {
    allowed,
    verdict: engine.verdict,
    setupSelected: engine.setupSelected,
    checksComplete: engine.checksComplete,
    checksPass,
    rulesPass: engine.rulesPass,
    blockers: engine.blockers,
    warnings: engine.warnings,
    adapted: engine.adapted,
    requiredYes: engine.requiredYes,
    coreYes: engine.coreYes,
    sizeScaleHint: engine.sizeScaleHint,
  };
}
