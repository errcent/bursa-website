/** Historical volatility from price series (annualized). */
export function historicalVolatility(prices: number[], periodsPerYear = 252): number {
  if (prices.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * periodsPerYear) * 100;
}

/** Simplified implied volatility estimate (Brenner-Subrahmanyam approximation). */
export function impliedVolatilityApprox(params: {
  optionPrice: number;
  stockPrice: number;
  strikePrice: number;
  daysToExpiry: number;
}): number {
  const { optionPrice, stockPrice, strikePrice, daysToExpiry } = params;
  if (daysToExpiry <= 0 || stockPrice <= 0) return 0;
  const t = daysToExpiry / 365;
  const atm = Math.sqrt(2 * Math.PI / t) * (optionPrice / stockPrice);
  return atm * 100;
}

/** ATR trailing stop levels. */
export function atrTrailingStop(params: {
  price: number;
  atr: number;
  multiplier: number;
  direction: "long" | "short";
}): { stopLevel: number; distance: number; distancePercent: number } {
  const { price, atr, multiplier, direction } = params;
  const distance = atr * multiplier;
  const stopLevel = direction === "long" ? price - distance : price + distance;
  const distancePercent = price > 0 ? (distance / price) * 100 : 0;
  return { stopLevel, distance, distancePercent };
}

/** Fibonacci retracement and extension levels. */
export function fibonacciLevels(high: number, low: number): {
  retracements: { level: string; price: number }[];
  extensions: { level: string; price: number }[];
} {
  const range = high - low;
  const retLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const extLevels = [1.272, 1.414, 1.618, 2, 2.618];

  return {
    retracements: retLevels.map((r) => ({
      level: `${(r * 100).toFixed(1)}%`,
      price: high - range * r,
    })),
    extensions: extLevels.map((e) => ({
      level: `${(e * 100).toFixed(1)}%`,
      price: high + range * (e - 1),
    })),
  };
}

/** R-multiple statistics from trade list. */
export function rMultipleStats(
  trades: number[]
): {
  count: number;
  avgR: number;
  totalR: number;
  winRate: number;
  avgWinR: number;
  avgLossR: number;
  expectancy: number;
} {
  if (trades.length === 0) {
    return { count: 0, avgR: 0, totalR: 0, winRate: 0, avgWinR: 0, avgLossR: 0, expectancy: 0 };
  }
  const wins = trades.filter((r) => r > 0);
  const losses = trades.filter((r) => r <= 0);
  const totalR = trades.reduce((a, b) => a + b, 0);
  const avgR = totalR / trades.length;
  const winRate = (wins.length / trades.length) * 100;
  const avgWinR = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLossR = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  const expectancy = (winRate / 100) * avgWinR + (1 - winRate / 100) * avgLossR;
  return { count: trades.length, avgR, totalR, winRate, avgWinR, avgLossR, expectancy };
}

/** Pearson correlation between two return series. */
export function correlation(returnsA: number[], returnsB: number[]): number {
  const n = Math.min(returnsA.length, returnsB.length);
  if (n < 2) return 0;
  const a = returnsA.slice(0, n);
  const b = returnsB.slice(0, n);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den > 0 ? num / den : 0;
}

/** Correlation matrix for multiple assets. */
export function correlationMatrix(
  assetReturns: number[][]
): { assets: number; matrix: number[][] } {
  const n = assetReturns.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i === j ? 1 : correlation(assetReturns[i], assetReturns[j]);
    }
  }
  return { assets: n, matrix };
}

/** Beta of stock vs market. */
export function beta(stockReturns: number[], marketReturns: number[]): number {
  const n = Math.min(stockReturns.length, marketReturns.length);
  if (n < 2) return 0;
  const s = stockReturns.slice(0, n);
  const m = marketReturns.slice(0, n);
  const meanS = s.reduce((a, b) => a + b, 0) / n;
  const meanM = m.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varM = 0;
  for (let i = 0; i < n; i++) {
    const ds = s[i] - meanS;
    const dm = m[i] - meanM;
    cov += ds * dm;
    varM += dm * dm;
  }
  return varM > 0 ? cov / varM : 0;
}

/** Parse comma-separated return data. */
export function parseReturns(input: string): number[] {
  return input
    .split(/[,;\s]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
}
