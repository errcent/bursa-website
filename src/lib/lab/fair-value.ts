export type DcfInput = {
  eps: number;
  growthRatePct: number;
  discountRatePct: number;
  years: number;
  terminalGrowthPct: number;
};

export type DcfResult = {
  fairValue: number;
  projectedSum: number;
  discountedTerminalValue: number;
  valid: boolean;
};

/**
 * Simplified multi-year DCF using EPS as a proxy for per-share owner earnings.
 * Projects EPS growth for N years, discounts each year back to present, then
 * adds a discounted terminal value using the Gordon growth (perpetuity) formula.
 */
export function calculateDcfFairValue({
  eps,
  growthRatePct,
  discountRatePct,
  years,
  terminalGrowthPct,
}: DcfInput): DcfResult {
  const r = discountRatePct / 100;
  const g = growthRatePct / 100;
  const tg = terminalGrowthPct / 100;

  if (r <= tg || eps <= 0 || years <= 0) {
    return { fairValue: 0, projectedSum: 0, discountedTerminalValue: 0, valid: false };
  }

  let projectedSum = 0;
  let epsAtYear = eps;
  for (let t = 1; t <= years; t++) {
    epsAtYear = eps * Math.pow(1 + g, t);
    projectedSum += epsAtYear / Math.pow(1 + r, t);
  }

  const terminalValue = (epsAtYear * (1 + tg)) / (r - tg);
  const discountedTerminalValue = terminalValue / Math.pow(1 + r, years);

  return {
    fairValue: projectedSum + discountedTerminalValue,
    projectedSum,
    discountedTerminalValue,
    valid: true,
  };
}

export function calculatePeRelativeFairValue(eps: number, comparablePe: number): number {
  return eps * comparablePe;
}

export type ValuationVerdict = "undervalued" | "overvalued" | "fair";

/** Margin of safety (%) of current price vs. fair value, and a simple verdict label. */
export function evaluateAgainstPrice(
  fairValue: number,
  currentPrice: number
): { marginOfSafetyPct: number; verdict: ValuationVerdict } {
  if (fairValue <= 0) return { marginOfSafetyPct: 0, verdict: "fair" };
  const marginOfSafetyPct = ((fairValue - currentPrice) / fairValue) * 100;
  const verdict: ValuationVerdict =
    marginOfSafetyPct > 5 ? "undervalued" : marginOfSafetyPct < -5 ? "overvalued" : "fair";
  return { marginOfSafetyPct, verdict };
}
