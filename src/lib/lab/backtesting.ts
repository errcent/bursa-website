export type BacktestTrade = {
  entry: number;
  exit: number;
  returnPct: number;
  type: "long" | "short";
};

/** Simple MA crossover backtest. */
export function maCrossoverBacktest(
  prices: number[],
  fastPeriod: number,
  slowPeriod: number
): {
  trades: BacktestTrade[];
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpe: number;
} {
  if (prices.length < slowPeriod + 1) {
    return { trades: [], totalReturn: 0, winRate: 0, maxDrawdown: 0, sharpe: 0 };
  }

  const sma = (data: number[], period: number, idx: number): number => {
    if (idx < period - 1) return 0;
    let sum = 0;
    for (let i = idx - period + 1; i <= idx; i++) sum += data[i];
    return sum / period;
  };

  const trades: BacktestTrade[] = [];
  let position: "long" | null = null;
  let entryPrice = 0;

  for (let i = slowPeriod; i < prices.length; i++) {
    const fast = sma(prices, fastPeriod, i);
    const slow = sma(prices, slowPeriod, i);
    const prevFast = sma(prices, fastPeriod, i - 1);
    const prevSlow = sma(prices, slowPeriod, i - 1);

    if (position === null && prevFast <= prevSlow && fast > slow) {
      position = "long";
      entryPrice = prices[i];
    } else if (position === "long" && prevFast >= prevSlow && fast < slow) {
      const ret = ((prices[i] - entryPrice) / entryPrice) * 100;
      trades.push({ entry: entryPrice, exit: prices[i], returnPct: ret, type: "long" });
      position = null;
    }
  }

  return computeBacktestStats(trades);
}

/** RSI backtest (oversold buy, overbought sell). */
export function rsiBacktest(
  prices: number[],
  period: number,
  oversold: number,
  overbought: number
): ReturnType<typeof maCrossoverBacktest> {
  if (prices.length < period + 2) {
    return { trades: [], totalReturn: 0, winRate: 0, maxDrawdown: 0, sharpe: 0 };
  }

  const rsiValues: number[] = [];
  for (let i = period; i < prices.length; i++) {
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = prices[j] - prices[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const rs = losses > 0 ? gains / losses : 100;
    rsiValues.push(100 - 100 / (1 + rs));
  }

  const trades: BacktestTrade[] = [];
  let position: "long" | null = null;
  let entryPrice = 0;

  for (let i = 0; i < rsiValues.length; i++) {
    const priceIdx = i + period;
    if (position === null && rsiValues[i] < oversold) {
      position = "long";
      entryPrice = prices[priceIdx];
    } else if (position === "long" && rsiValues[i] > overbought) {
      const ret = ((prices[priceIdx] - entryPrice) / entryPrice) * 100;
      trades.push({ entry: entryPrice, exit: prices[priceIdx], returnPct: ret, type: "long" });
      position = null;
    }
  }

  return computeBacktestStats(trades);
}

function computeBacktestStats(trades: BacktestTrade[]) {
  if (trades.length === 0) {
    return { trades, totalReturn: 0, winRate: 0, maxDrawdown: 0, sharpe: 0 };
  }
  const totalReturn = trades.reduce((s, t) => s + t.returnPct, 0);
  const wins = trades.filter((t) => t.returnPct > 0).length;
  const winRate = (wins / trades.length) * 100;

  let equity = 100;
  let peak = equity;
  let maxDd = 0;
  const returns: number[] = [];
  for (const t of trades) {
    equity *= 1 + t.returnPct / 100;
    returns.push(t.returnPct);
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

  return { trades, totalReturn, winRate, maxDrawdown: maxDd, sharpe };
}

/** Walk-forward analysis. */
export function walkForwardAnalysis(
  prices: number[],
  inSampleRatio: number,
  fastRange: [number, number],
  slowRange: [number, number]
): {
  inSample: ReturnType<typeof maCrossoverBacktest> & { fast: number; slow: number };
  outOfSample: ReturnType<typeof maCrossoverBacktest>;
} {
  const splitIdx = Math.floor(prices.length * inSampleRatio);
  const inPrices = prices.slice(0, splitIdx);
  const outPrices = prices.slice(splitIdx);

  let bestFast = 5;
  let bestSlow = 20;
  let bestReturn = -Infinity;

  for (let fast = fastRange[0]; fast <= fastRange[1]; fast++) {
    for (let slow = slowRange[0]; slow <= slowRange[1]; slow++) {
      if (fast >= slow) continue;
      const result = maCrossoverBacktest(inPrices, fast, slow);
      if (result.totalReturn > bestReturn) {
        bestReturn = result.totalReturn;
        bestFast = fast;
        bestSlow = slow;
      }
    }
  }

  const inSample = { ...maCrossoverBacktest(inPrices, bestFast, bestSlow), fast: bestFast, slow: bestSlow };
  const outOfSample = maCrossoverBacktest(outPrices, bestFast, bestSlow);
  return { inSample, outOfSample };
}

/** Parameter optimization grid search. */
export function parameterOptimization(
  prices: number[],
  fastRange: [number, number],
  slowRange: [number, number]
): { fast: number; slow: number; totalReturn: number; winRate: number; sharpe: number }[] {
  const results: { fast: number; slow: number; totalReturn: number; winRate: number; sharpe: number }[] = [];
  for (let fast = fastRange[0]; fast <= fastRange[1]; fast++) {
    for (let slow = slowRange[0]; slow <= slowRange[1]; slow++) {
      if (fast >= slow) continue;
      const r = maCrossoverBacktest(prices, fast, slow);
      results.push({ fast, slow, totalReturn: r.totalReturn, winRate: r.winRate, sharpe: r.sharpe });
    }
  }
  return results.sort((a, b) => b.sharpe - a.sharpe);
}

/** Seasonality analysis from monthly returns. */
export function seasonalityAnalysis(
  monthlyReturns: number[]
): { month: number; avgReturn: number; winRate: number; count: number }[] {
  const months: { month: number; returns: number[] }[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    returns: [],
  }));

  monthlyReturns.forEach((ret, idx) => {
    months[idx % 12].returns.push(ret);
  });

  return months.map((m) => ({
    month: m.month,
    avgReturn: m.returns.length > 0 ? m.returns.reduce((a, b) => a + b, 0) / m.returns.length : 0,
    winRate: m.returns.length > 0 ? (m.returns.filter((r) => r > 0).length / m.returns.length) * 100 : 0,
    count: m.returns.length,
  }));
}

/** Parse comma-separated prices. */
export function parsePrices(input: string): number[] {
  return input
    .split(/[,;\s]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);
}

/** Generate sample price data for demo. */
export function generateSamplePrices(count: number, startPrice = 100, volatility = 0.02): number[] {
  const prices = [startPrice];
  for (let i = 1; i < count; i++) {
    const change = (Math.random() - 0.48) * volatility * prices[i - 1];
    prices.push(Math.max(1, prices[i - 1] + change));
  }
  return prices;
}
