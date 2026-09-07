export type Direction = "long" | "short";

/** Floating % return from entry to a given price. Positive = profit, negative = loss. */
export function floatingPercent(entry: number, price: number, direction: Direction): number {
  if (entry <= 0) return 0;
  return direction === "long" ? ((price - entry) / entry) * 100 : ((entry - price) / entry) * 100;
}

/** Inverse of `floatingPercent`: price that produces a target floating % from entry. */
export function priceFromFloatingPercent(
  entry: number,
  targetFloatingPct: number,
  direction: Direction
): number {
  return direction === "long"
    ? entry * (1 + targetFloatingPct / 100)
    : entry * (1 - targetFloatingPct / 100);
}

/** Signed pip movement between entry and price (sign follows floating direction, not raw price diff). */
export function floatingPips(entry: number, price: number, direction: Direction, pipSize: number): number {
  if (pipSize <= 0) return 0;
  const diff = direction === "long" ? price - entry : entry - price;
  return diff / pipSize;
}
