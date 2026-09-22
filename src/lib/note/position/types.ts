/**
 * Bursa position-cycle domain model (clean-room implementation).
 *
 * A Fill is one execution print and is never mutated by analytics.
 * A PositionCycle is one flat-to-flat holding period derived from fills.
 * Every metric derives from cycles, never from raw fills directly.
 */

export type FillSide = "buy" | "sell";
export type FillOrigin = "sync" | "import" | "manual";

export interface Fill {
  id: string;
  accountRef: string;
  ticker: string;
  side: FillSide;
  /** Always positive; side carries direction. */
  size: number;
  /** Per unit, in account currency. */
  price: number;
  /** Commission + fees for this print, absolute value. */
  fee: number;
  /** ISO 8601 timestamp. */
  filledAt: string;
  origin: FillOrigin;
  /** Keeps separately reported mirrors from netting together. */
  batchTag?: string;
  /** Source row order for same-instant tiebreaks. */
  sequence?: number;
  /** Statement-declared gross for this print's closing share (optional). */
  declaredGross?: number;
}

export type CycleMethod = "fifo" | "lifo" | "average";
export type PositionDirection = "long" | "short";
export type CycleOutcome = "open" | "win" | "loss" | "flat";

export interface ExitSlice {
  fillId: string;
  realizedGross: number;
  size: number;
}

export interface PositionCycle {
  /** Stable ref surviving rebuilds: account|ticker|direction|openedAt (+collision suffix). */
  ref: string;
  accountRef: string;
  ticker: string;
  direction: PositionDirection;
  outcome: CycleOutcome;
  openedAt: string;
  closedAt?: string;
  entrySize: number;
  openSize: number;
  meanEntry: number;
  meanExit?: number;
  gross: number;
  fees: number;
  net: number;
  /** Declared-minus-implied gross summed across slices. Surfaced for review, never folded silently. */
  grossVariance: number;
  fillCount: number;
  fillIds: string[];
  slices: ExitSlice[];
  heldMs?: number;
  pointValue?: number;
}
