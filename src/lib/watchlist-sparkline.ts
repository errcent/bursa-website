/**
 * Deterministic mock intraday series for watchlist mini-charts.
 * Same ticker always yields the same day-move shape (demo / no live market API).
 */

export type WatchlistDayMove = {
  /** Normalized intraday points (open → close), length = points */
  points: number[];
  /** Day change percent from first to last point */
  changePct: number;
  /** Rough display price derived from ticker hash */
  priceLabel: string;
};

function hashTicker(ticker: string): number {
  let h = 2166136261;
  const s = ticker.trim().toUpperCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function formatPrice(base: number, ticker: string): string {
  const upper = ticker.toUpperCase();
  if (upper.includes("BTC") || upper.includes("ETH") || upper.length > 5) {
    return base.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  if (base < 20) {
    return base.toFixed(4);
  }
  return base.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Build a consistent intraday sparkline + % change for a ticker.
 */
export function getWatchlistDayMove(ticker: string, pointCount = 24): WatchlistDayMove {
  const safeCount = Math.max(2, pointCount);
  const seed = hashTicker(ticker);
  const rand = mulberry32(seed);

  const drift = (rand() - 0.48) * 0.012;
  const volatility = 0.004 + rand() * 0.008;

  const points: number[] = [];
  let value = 100;
  for (let i = 0; i < safeCount; i++) {
    const noise = (rand() - 0.5) * 2 * volatility;
    const meanReversion = (100 - value) * 0.02;
    value = value * (1 + drift + noise + meanReversion);
    if (!Number.isFinite(value) || value <= 0) value = 100;
    points.push(value);
  }

  const open = points[0] ?? 100;
  const close = points[points.length - 1] ?? open;
  const changePct = open === 0 ? 0 : ((close - open) / open) * 100;

  const priceBase = 500 + (seed % 9500) + rand() * 80;
  const priceNow = priceBase * (close / 100);

  return {
    points,
    changePct: Math.round(changePct * 100) / 100,
    priceLabel: formatPrice(priceNow, ticker),
  };
}
