import type { CycleMethod } from "./types";

export interface Lot {
  size: number;
  price: number;
}

/** Below this, a position counts as flat (float-drift guard for fractional sizes). */
export const FLAT_TOL = 1e-9;

export function openSizeOf(lots: Lot[]): number {
  let total = 0;
  for (const lot of lots) total += lot.size;
  return total;
}

export interface MatchResult {
  /** Entry value (price x size) matched by this exit. */
  matchedValue: number;
  /** Remaining lots after the match (new array; input untouched). */
  rest: Lot[];
}

/**
 * Pure lot consumption. FIFO takes oldest first, LIFO takes newest first,
 * average prices every exit at the blended mean and scales all lots down.
 */
export function matchLots(lots: Lot[], size: number, method: CycleMethod): MatchResult {
  if (method === "average") {
    const totalSize = openSizeOf(lots);
    let totalValue = 0;
    for (const lot of lots) totalValue += lot.size * lot.price;
    const mean = totalSize > 0 ? totalValue / totalSize : 0;
    const ratio = totalSize > 0 ? (totalSize - size) / totalSize : 0;
    const rest: Lot[] = [];
    for (const lot of lots) {
      const shrunk = lot.size * ratio;
      if (shrunk > FLAT_TOL) rest.push({ size: shrunk, price: lot.price });
    }
    return { matchedValue: mean * size, rest };
  }

  const rest = lots.map((l) => ({ ...l }));
  let left = size;
  let matchedValue = 0;
  while (left > FLAT_TOL && rest.length > 0) {
    const idx = method === "fifo" ? 0 : rest.length - 1;
    const lot = rest[idx]!;
    const take = Math.min(lot.size, left);
    matchedValue += take * lot.price;
    lot.size -= take;
    left -= take;
    if (lot.size <= FLAT_TOL) rest.splice(idx, 1);
  }
  return { matchedValue, rest };
}
