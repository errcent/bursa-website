/**
 * R-multiple computation (v3 P0).
 *
 * R = risk unit = |entry - stopLoss|.
 * plannedRR = reward/risk = (takeProfit - entry) / (entry - stopLoss) for longs.
 * actualRR = (exit - entry) / |entry - stopLoss|.
 *
 * If any of entry/stopLoss/exit is missing, R is null (not zero).
 * Sign convention: positive R = profit, negative R = loss.
 */

export function riskUnit(entry: number | null, stopLoss: number | null): number | null {
  if (entry == null || stopLoss == null) return null;
  const risk = Math.abs(entry - stopLoss);
  return risk === 0 ? null : risk;
}

export function plannedRR(
  entry: number | null,
  stopLoss: number | null,
  takeProfit: number | null,
  side: string
): number | null {
  if (entry == null || stopLoss == null || takeProfit == null) return null;
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return null;
  const isShort = side.toUpperCase() === "SELL" || side.toUpperCase() === "SHORT";
  const reward = isShort
    ? (entry - takeProfit)
    : (takeProfit - entry);
  return reward / risk;
}

export function actualRR(
  entry: number | null,
  stopLoss: number | null,
  exit: number | null,
  side: string
): number | null {
  if (entry == null || stopLoss == null || exit == null) return null;
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return null;
  const isShort = side.toUpperCase() === "SELL" || side.toUpperCase() === "SHORT";
  const pnl = isShort ? (entry - exit) : (exit - entry);
  return pnl / risk;
}

/** Format R for display: "+2.1R" or "-1.3R" or "-" */
export function formatR(r: number | null, decimals = 1): string {
  if (r == null || !Number.isFinite(r)) return "-";
  const sign = r >= 0 ? "+" : "";
  return `${sign}${r.toFixed(decimals)}R`;
}
