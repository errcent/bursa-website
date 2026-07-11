/** Gordon Growth Model (DDM). */
export function dividendDiscountModel(params: {
  dividend: number;
  growthRate: number;
  discountRate: number;
}): number {
  const { dividend, growthRate, discountRate } = params;
  const g = growthRate / 100;
  const r = discountRate / 100;
  if (r <= g) return 0;
  const nextDividend = dividend * (1 + g);
  return nextDividend / (r - g);
}

/** Multi-stage DDM (2 stages). */
export function multiStageDdm(params: {
  dividend: number;
  highGrowthRate: number;
  stableGrowthRate: number;
  discountRate: number;
  highGrowthYears: number;
}): number {
  const { dividend, highGrowthRate, stableGrowthRate, discountRate, highGrowthYears } = params;
  const r = discountRate / 100;
  const g1 = highGrowthRate / 100;
  const g2 = stableGrowthRate / 100;
  if (r <= g2) return 0;

  let value = 0;
  let d = dividend;
  for (let y = 1; y <= highGrowthYears; y++) {
    d *= 1 + g1;
    value += d / Math.pow(1 + r, y);
  }
  const terminalDividend = d * (1 + g2);
  const terminalValue = terminalDividend / (r - g2);
  value += terminalValue / Math.pow(1 + r, highGrowthYears);
  return value;
}

/** Graham Number = sqrt(22.5 × EPS × BVPS). */
export function grahamNumber(eps: number, bookValuePerShare: number): number {
  if (eps <= 0 || bookValuePerShare <= 0) return 0;
  return Math.sqrt(22.5 * eps * bookValuePerShare);
}

/** PEG ratio and interpretation. */
export function pegRatio(peRatio: number, earningsGrowthRate: number): {
  peg: number;
  verdict: "undervalued" | "fair" | "overvalued";
} {
  if (earningsGrowthRate <= 0) return { peg: 0, verdict: "overvalued" };
  const peg = peRatio / earningsGrowthRate;
  let verdict: "undervalued" | "fair" | "overvalued" = "fair";
  if (peg < 1) verdict = "undervalued";
  else if (peg > 1.5) verdict = "overvalued";
  return { peg, verdict };
}

/** DuPont ROE decomposition and projection. */
export function duPontRoe(params: {
  netProfitMargin: number;
  assetTurnover: number;
  equityMultiplier: number;
}): { roe: number; roic: number } {
  const npm = params.netProfitMargin / 100;
  const at = params.assetTurnover;
  const em = params.equityMultiplier;
  const roe = npm * at * em * 100;
  const roic = npm * at * 100;
  return { roe, roic };
}

/** Project ROE forward. */
export function projectRoe(params: {
  currentRoe: number;
  marginChange: number;
  turnoverChange: number;
  leverageChange: number;
  years: number;
}): number[] {
  const { currentRoe, marginChange, turnoverChange, leverageChange, years } = params;
  const projection: number[] = [];
  let roe = currentRoe;
  for (let y = 1; y <= years; y++) {
    roe += marginChange + turnoverChange * 0.5 + leverageChange * 0.3;
    projection.push(roe);
  }
  return projection;
}

/** Earnings growth projection. */
export function projectEarnings(params: {
  currentEps: number;
  revenueGrowth: number;
  marginImprovement: number;
  shareChange: number;
  years: number;
}): { year: number; eps: number; growth: number }[] {
  const { currentEps, revenueGrowth, marginImprovement, shareChange, years } = params;
  const projection: { year: number; eps: number; growth: number }[] = [];
  let eps = currentEps;
  for (let y = 1; y <= years; y++) {
    const growth = revenueGrowth + marginImprovement - shareChange;
    eps *= 1 + growth / 100;
    projection.push({ year: y, eps, growth });
  }
  return projection;
}
