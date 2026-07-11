/** Position size based on risk % of account and stop loss distance. */
export function positionSize(params: {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
}): { riskAmount: number; shares: number; positionValue: number; riskPerShare: number } {
  const { accountBalance, riskPercent, entryPrice, stopLossPrice } = params;
  const riskAmount = accountBalance * (riskPercent / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  if (riskPerShare <= 0) return { riskAmount, shares: 0, positionValue: 0, riskPerShare: 0 };
  const shares = riskAmount / riskPerShare;
  return { riskAmount, shares, positionValue: shares * entryPrice, riskPerShare };
}

/** Risk-reward ratio and P/L amounts. */
export function riskReward(params: {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSize?: number;
}): {
  riskAmount: number;
  rewardAmount: number;
  ratio: number;
  riskPercent: number;
  rewardPercent: number;
} {
  const { entryPrice, stopLossPrice, takeProfitPrice, positionSize = 1 } = params;
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  const rewardPerUnit = Math.abs(takeProfitPrice - entryPrice);
  const riskAmount = riskPerUnit * positionSize;
  const rewardAmount = rewardPerUnit * positionSize;
  const ratio = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;
  const riskPercent = entryPrice > 0 ? (riskPerUnit / entryPrice) * 100 : 0;
  const rewardPercent = entryPrice > 0 ? (rewardPerUnit / entryPrice) * 100 : 0;
  return { riskAmount, rewardAmount, ratio, riskPercent, rewardPercent };
}

/** Breakeven price including costs. */
export function breakevenPrice(params: {
  entryPrice: number;
  quantity: number;
  commissionBuy: number;
  commissionSell: number;
  spreadCost?: number;
  taxRate?: number;
  direction: "long" | "short";
}): number {
  const { entryPrice, quantity, commissionBuy, commissionSell, spreadCost = 0, taxRate = 0, direction } = params;
  const totalCost = commissionBuy + commissionSell + spreadCost;
  const costPerShare = quantity > 0 ? totalCost / quantity : 0;
  if (direction === "long") {
    return entryPrice + costPerShare / (1 - taxRate / 100);
  }
  return entryPrice - costPerShare / (1 - taxRate / 100);
}

/** Expectancy in R-multiples. */
export function expectancy(winRate: number, riskRewardRatio: number): number {
  const wr = winRate / 100;
  return wr * riskRewardRatio - (1 - wr);
}

/** Kelly fraction (full Kelly). Returns 0 if negative edge. */
export function kellyFraction(winRate: number, riskRewardRatio: number): number {
  const p = winRate / 100;
  const q = 1 - p;
  const b = riskRewardRatio;
  if (b <= 0) return 0;
  const f = (p * b - q) / b;
  return Math.max(0, f);
}

/** Half-Kelly and quarter-Kelly. */
export function kellyVariants(winRate: number, riskRewardRatio: number) {
  const full = kellyFraction(winRate, riskRewardRatio);
  return { full, half: full / 2, quarter: full / 4 };
}

/** Optimal F using simplified Ralph Vince approach on trade R-multiples. */
export function optimalF(tradeResults: number[]): { optimalF: number; twr: number } {
  if (tradeResults.length === 0) return { optimalF: 0, twr: 1 };
  const biggestLoss = Math.min(...tradeResults, 0);
  if (biggestLoss >= 0) return { optimalF: 0, twr: 1 };

  let bestF = 0;
  let bestTwr = 0;
  for (let f = 0.01; f <= 1; f += 0.01) {
    let hpr = 1;
    for (const r of tradeResults) {
      hpr *= 1 + f * (-r / biggestLoss);
      if (hpr <= 0) break;
    }
    if (hpr > bestTwr) {
      bestTwr = hpr;
      bestF = f;
    }
  }
  return { optimalF: bestF, twr: bestTwr };
}

/** Fixed fractional position size. */
export function fixedFractional(accountBalance: number, fraction: number): number {
  return accountBalance * Math.max(0, Math.min(1, fraction));
}

/** Simulate max drawdown from random trade sequence. */
export function simulateMaxDrawdown(params: {
  startingCapital: number;
  winRate: number;
  riskRewardRatio: number;
  riskPerTrade: number;
  numTrades: number;
  numSimulations: number;
}): { median: number; worst: number; best: number; p95: number } {
  const { startingCapital, winRate, riskRewardRatio, riskPerTrade, numTrades, numSimulations } = params;
  const drawdowns: number[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    let equity = startingCapital;
    let peak = equity;
    let maxDd = 0;

    for (let t = 0; t < numTrades; t++) {
      const win = Math.random() < winRate / 100;
      const rMultiple = win ? riskRewardRatio : -1;
      equity += equity * (riskPerTrade / 100) * rMultiple;
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    }
    drawdowns.push(maxDd);
  }

  drawdowns.sort((a, b) => a - b);
  const median = drawdowns[Math.floor(drawdowns.length / 2)] ?? 0;
  const worst = drawdowns[drawdowns.length - 1] ?? 0;
  const best = drawdowns[0] ?? 0;
  const p95 = drawdowns[Math.floor(drawdowns.length * 0.95)] ?? 0;
  return { median, worst, best, p95 };
}
