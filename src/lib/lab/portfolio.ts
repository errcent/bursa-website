/** Simple VaR (parametric/historical). */
export function valueAtRisk(params: {
  portfolioValue: number;
  volatility: number;
  confidenceLevel: number;
  holdingPeriod?: number;
}): { var: number; varPercent: number } {
  const { portfolioValue, volatility, confidenceLevel, holdingPeriod = 1 } = params;
  const zScores: Record<number, number> = { 90: 1.282, 95: 1.645, 99: 2.326 };
  const z = zScores[confidenceLevel] ?? 1.645;
  const dailyVol = volatility / Math.sqrt(252);
  const periodVol = dailyVol * Math.sqrt(holdingPeriod);
  const varPercent = z * periodVol;
  const varAmount = portfolioValue * (varPercent / 100);
  return { var: varAmount, varPercent };
}

/** Simple 2-asset allocation optimizer (minimum variance). */
export function minVarianceAllocation(params: {
  volA: number;
  volB: number;
  correlation: number;
}): { weightA: number; weightB: number; portfolioVol: number } {
  const { volA, volB, correlation } = params;
  const cov = correlation * (volA / 100) * (volB / 100);
  const varA = (volA / 100) ** 2;
  const varB = (volB / 100) ** 2;
  const denom = varA + varB - 2 * cov;
  if (denom <= 0) return { weightA: 0.5, weightB: 0.5, portfolioVol: 0 };
  const weightA = (varB - cov) / denom;
  const weightB = 1 - weightA;
  const portVar = weightA ** 2 * varA + weightB ** 2 * varB + 2 * weightA * weightB * cov;
  return {
    weightA: Math.max(0, Math.min(1, weightA)) * 100,
    weightB: Math.max(0, Math.min(1, weightB)) * 100,
    portfolioVol: Math.sqrt(portVar) * 100,
  };
}

/** Rebalancing trades needed. */
export function rebalancingTrades(params: {
  assets: { name: string; currentValue: number; targetPercent: number }[];
}): {
  totalValue: number;
  trades: { name: string; currentPercent: number; targetPercent: number; tradeAmount: number }[];
} {
  const totalValue = params.assets.reduce((s, a) => s + a.currentValue, 0);
  const trades = params.assets.map((a) => {
    const currentPercent = totalValue > 0 ? (a.currentValue / totalValue) * 100 : 0;
    const targetValue = totalValue * (a.targetPercent / 100);
    return {
      name: a.name,
      currentPercent,
      targetPercent: a.targetPercent,
      tradeAmount: targetValue - a.currentValue,
    };
  });
  return { totalValue, trades };
}

/** Tax impact on capital gains. */
export function taxImpact(params: {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  taxRate: number;
  isFinalTax?: boolean;
}): {
  grossGain: number;
  tax: number;
  netGain: number;
  netReturn: number;
} {
  const { buyPrice, sellPrice, quantity, taxRate, isFinalTax = true } = params;
  const grossGain = (sellPrice - buyPrice) * quantity;
  const taxableGain = Math.max(0, grossGain);
  const tax = isFinalTax ? taxableGain * (taxRate / 100) : taxableGain * (taxRate / 100);
  const netGain = grossGain - tax;
  const cost = buyPrice * quantity;
  const netReturn = cost > 0 ? (netGain / cost) * 100 : 0;
  return { grossGain, tax, netGain, netReturn };
}

/** Inflation-adjusted (real) return. */
export function inflationAdjustedReturn(nominalReturn: number, inflationRate: number): {
  realReturn: number;
  purchasingPowerLoss: number;
} {
  const nominal = nominalReturn / 100;
  const inflation = inflationRate / 100;
  const real = ((1 + nominal) / (1 + inflation) - 1) * 100;
  return { realReturn: real, purchasingPowerLoss: inflationRate };
}

/** CAGR calculation. */
export function cagr(beginValue: number, endValue: number, years: number): number {
  if (beginValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / beginValue, 1 / years) - 1) * 100;
}
