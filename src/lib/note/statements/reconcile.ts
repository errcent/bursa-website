/**
 * Statement reconciliation (clean-room, inverted mechanism).
 *
 * Where other journals silently fold statement-vs-implied gaps into fees,
 * Bursa surfaces every gap as a review item: stated vs implied, absolute
 * difference, and a suggested cause. Nothing is hidden, nothing is guessed.
 */

export interface VarianceItem {
  ref: string;
  stated: number;
  implied: number;
  diff: number;
  cause: string;
}

export interface ReconcileInput {
  ref: string;
  statedNet: number | null;
  impliedGross: number;
  fees: number;
}

/**
 * Compare a statement's declared net against price-implied gross minus fees.
 * Returns a variance item when the gap clears the materiality floor, else null.
 */
export function reconcileTrade(input: ReconcileInput, floor = 0.01): VarianceItem | null {
  const { ref, statedNet, impliedGross, fees } = input;
  if (statedNet == null || !Number.isFinite(statedNet)) return null;
  const expected = impliedGross - Math.abs(fees);
  const diff = statedNet - expected;
  if (Math.abs(diff) < floor) return null;
  const cause = Math.abs(diff) > Math.abs(impliedGross) * 0.5 + 100
    ? "Gap melebihi 50% gross — kemungkinan contract multiplier atau simbol salah."
    : Math.abs(diff) < Math.abs(fees) * 2 + 1
      ? "Gap kecil — kemungkinan fee/funding tak tercatat atau pembulatan."
      : "Gap material — cek partial fill hilang, split, atau kurs silang.";
  return { ref, stated: statedNet, implied: expected, diff, cause };
}
