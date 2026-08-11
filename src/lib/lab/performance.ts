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
