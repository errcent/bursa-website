/** Pip/point value for forex. */
export function pipValue(params: {
  pipSize: number;
  lotSize: number;
  contractSize: number;
  exchangeRate?: number;
}): number {
  const { pipSize, lotSize, contractSize, exchangeRate = 1 } = params;
  return (pipSize * lotSize * contractSize) / exchangeRate;
}

/** Lot size conversions. */
export function lotConversions(standardLots: number): {
  standard: number;
  mini: number;
  micro: number;
  units: number;
} {
  return {
    standard: standardLots,
    mini: standardLots * 10,
    micro: standardLots * 100,
    units: standardLots * 100000,
  };
}

/** Margin requirement. */
export function marginRequired(params: {
  positionValue: number;
  leverage: number;
}): { margin: number; buyingPower: number } {
  const { positionValue, leverage } = params;
  if (leverage <= 0) return { margin: positionValue, buyingPower: 0 };
  const margin = positionValue / leverage;
  return { margin, buyingPower: positionValue };
}

/** Swap/rollover fee. */
export function swapFee(params: {
  lotSize: number;
  swapRate: number;
  nights: number;
  contractSize?: number;
}): number {
  const { lotSize, swapRate, nights, contractSize = 100000 } = params;
  return lotSize * contractSize * swapRate * nights;
}

/** Commission and slippage impact. */
export function commissionSlippageImpact(params: {
  winRate: number;
  riskRewardRatio: number;
  commissionPerTrade: number;
  slippagePerTrade: number;
  riskPerTrade: number;
}): {
  adjustedExpectancy: number;
  breakevenWinRate: number;
  costPerTrade: number;
  annualCost: number;
} {
  const { winRate, riskRewardRatio, commissionPerTrade, slippagePerTrade, riskPerTrade } = params;
  const costPerTrade = commissionPerTrade + slippagePerTrade;
  const wr = winRate / 100;
  const rawExpectancy = wr * riskRewardRatio - (1 - wr);
  const costInR = riskPerTrade > 0 ? costPerTrade / riskPerTrade : 0;
  const adjustedExpectancy = rawExpectancy - costInR;
  const breakevenWinRate = riskRewardRatio > 0 ? ((1 + costInR) / (riskRewardRatio + 1)) * 100 : 100;
  return { adjustedExpectancy, breakevenWinRate, costPerTrade, annualCost: costPerTrade * 252 };
}

/** Crypto trading fees and funding. */
export function cryptoFees(params: {
  positionValue: number;
  makerFee: number;
  takerFee: number;
  fundingRate: number;
  holdingHours: number;
  isMaker?: boolean;
}): {
  entryFee: number;
  exitFee: number;
  fundingCost: number;
  totalCost: number;
} {
  const { positionValue, makerFee, takerFee, fundingRate, holdingHours, isMaker = false } = params;
  const feeRate = isMaker ? makerFee : takerFee;
  const entryFee = positionValue * (feeRate / 100);
  const exitFee = positionValue * (takerFee / 100);
  const fundingPeriods = holdingHours / 8;
  const fundingCost = positionValue * (fundingRate / 100) * fundingPeriods;
  return { entryFee, exitFee, fundingCost, totalCost: entryFee + exitFee + fundingCost };
}
