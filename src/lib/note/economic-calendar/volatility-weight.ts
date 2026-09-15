import type { EconomicEvent } from "@/lib/note/economic-calendar/types";

const HEAVY_HIGH_RE =
  /\b(cpi|core cpi|pce|nfp|non[- ]farm|employment change|fomc|fed interest|interest rate decision|monetary policy statement)\b/i;

/** Tier-1 macro releases: widen the pre-event seconds window (20 min vs 15). */
export function isHeavyHighImpact(event: EconomicEvent): boolean {
  if (event.impact !== "high") return false;
  return HEAVY_HIGH_RE.test(event.title);
}

export type VolatilityCountdownConfig = {
  /** When to switch from hours/minutes to minutes+seconds. */
  phase3Ms: number;
  /** When to enter live second ticks (default 5 min). */
  phase4Ms: number;
  allowSeconds: boolean;
};

export function volatilityCountdownConfig(
  event: EconomicEvent,
  volatilityAware: boolean
): VolatilityCountdownConfig {
  if (!volatilityAware) {
    return {
      phase3Ms: 15 * 60 * 1000,
      phase4Ms: 5 * 60 * 1000,
      allowSeconds: true,
    };
  }

  if (event.impact === "low" || event.impact === "holiday") {
    return {
      phase3Ms: Number.POSITIVE_INFINITY,
      phase4Ms: Number.POSITIVE_INFINITY,
      allowSeconds: false,
    };
  }

  if (isHeavyHighImpact(event)) {
    return {
      phase3Ms: 20 * 60 * 1000,
      phase4Ms: 5 * 60 * 1000,
      allowSeconds: true,
    };
  }

  return {
    phase3Ms: 15 * 60 * 1000,
    phase4Ms: 5 * 60 * 1000,
    allowSeconds: true,
  };
}
