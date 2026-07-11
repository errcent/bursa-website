/** Trade expectancy in R and nominal value. */
export function tradeExpectancy(params: {
  winRate: number;
  riskRewardRatio: number;
  riskPerTrade: number;
  numTrades: number;
}): {
  expectancyR: number;
  expectancyNominal: number;
  totalExpected: number;
  profitFactor: number;
} {
  const { winRate, riskRewardRatio, riskPerTrade, numTrades } = params;
  const wr = winRate / 100;
  const expectancyR = wr * riskRewardRatio - (1 - wr);
  const expectancyNominal = expectancyR * riskPerTrade;
  const totalExpected = expectancyNominal * numTrades;
  const avgWin = riskRewardRatio * riskPerTrade;
  const avgLoss = riskPerTrade;
  const profitFactor = avgLoss > 0 ? (wr * avgWin) / ((1 - wr) * avgLoss) : 0;
  return { expectancyR, expectancyNominal, totalExpected, profitFactor };
}

/** Required win rate for a given R:R to break even. */
export function breakevenWinRate(riskRewardRatio: number): number {
  if (riskRewardRatio <= 0) return 100;
  return (1 / (1 + riskRewardRatio)) * 100;
}

/** Analyze scenarios for target profit. */
export function winRateScenarios(
  targetReturn: number,
  riskPerTrade: number,
  numTrades: number
): { winRate: number; riskReward: number; expectancy: number }[] {
  const scenarios: { winRate: number; riskReward: number; expectancy: number }[] = [];
  for (let wr = 30; wr <= 80; wr += 10) {
    for (let rr = 0.5; rr <= 5; rr += 0.5) {
      const exp = (wr / 100) * rr - (1 - wr / 100);
      const totalReturn = exp * riskPerTrade * numTrades;
      if (Math.abs(totalReturn - targetReturn) < targetReturn * 0.15 + 5) {
        scenarios.push({ winRate: wr, riskReward: rr, expectancy: exp });
      }
    }
  }
  return scenarios.sort((a, b) => b.expectancy - a.expectancy);
}

/** Probability of ruin (simplified formula). */
export function ruinProbability(params: {
  winRate: number;
  riskRewardRatio: number;
  riskPerTrade: number;
  startingCapital: number;
}): number {
  const { winRate, riskRewardRatio, riskPerTrade, startingCapital } = params;
  const p = winRate / 100;
  const q = 1 - p;
  const edge = p * riskRewardRatio - q;
  if (edge <= 0) return 1;

  const units = startingCapital / riskPerTrade;
  const ratio = q / p;
  if (ratio >= 1) {
    return Math.pow(ratio, units) * 100;
  }
  return Math.pow(ratio, units) * 100;
}

/** Generate equity curve from trade sequence. */
export function generateEquityCurve(params: {
  startingCapital: number;
  winRate: number;
  riskRewardRatio: number;
  riskPerTrade: number;
  numTrades: number;
}): { trade: number; equity: number; drawdown: number }[] {
  const { startingCapital, winRate, riskRewardRatio, riskPerTrade, numTrades } = params;
  const curve: { trade: number; equity: number; drawdown: number }[] = [];
  let equity = startingCapital;
  let peak = equity;

  curve.push({ trade: 0, equity, drawdown: 0 });
  for (let t = 1; t <= numTrades; t++) {
    const win = Math.random() < winRate / 100;
    const rMultiple = win ? riskRewardRatio : -1;
    equity += equity * (riskPerTrade / 100) * rMultiple;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    curve.push({ trade: t, equity, drawdown: dd });
  }
  return curve;
}

/** Trade sequence random walk. */
export function tradeSequence(params: {
  numTrades: number;
  winRate: number;
  riskRewardRatio: number;
}): { trade: number; result: "win" | "loss"; rMultiple: number; cumulative: number }[] {
  const { numTrades, winRate, riskRewardRatio } = params;
  const sequence: { trade: number; result: "win" | "loss"; rMultiple: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (let t = 1; t <= numTrades; t++) {
    const win = Math.random() < winRate / 100;
    const rMultiple = win ? riskRewardRatio : -1;
    cumulative += rMultiple;
    sequence.push({ trade: t, result: win ? "win" : "loss", rMultiple, cumulative });
  }
  return sequence;
}

/** Monte Carlo helpers (shared). */
export function runMonteCarloSimulation(params: {
  startingCapital: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  numTrades: number;
  numSimulations: number;
}): { finals: number[]; median: number; worst: number; best: number } {
  const { startingCapital, winRate, avgWinPct, avgLossPct, numTrades, numSimulations } = params;
  const finals: number[] = [];
  const wr = winRate / 100;

  for (let sim = 0; sim < numSimulations; sim++) {
    let capital = startingCapital;
    for (let t = 0; t < numTrades; t++) {
      const win = Math.random() < wr;
      capital *= 1 + (win ? avgWinPct : -avgLossPct) / 100;
    }
    finals.push(capital);
  }

  finals.sort((a, b) => a - b);
  return {
    finals,
    median: finals[Math.floor(finals.length / 2)] ?? startingCapital,
    worst: finals[0] ?? startingCapital,
    best: finals[finals.length - 1] ?? startingCapital,
  };
}
