/**
 * Drawdown calculation (v3 P1).
 *
 * Computes max drawdown and current drawdown from
 * a cumulative PnL series.
 */

import type { JournalEntry } from "@/lib/note/types";
import { isPnlKind } from "@/lib/note/types";
import { dayKey, filterEntries } from "@/lib/note/stats";

export interface DrawdownResult {
  maxDrawdown: number;
  currentDrawdown: number;
  peakPnl: number;
  currentPnl: number;
  drawdownPct: number;
}

/**
 * Compute drawdown from a list of trade entries (sorted by date).
 * Drawdown = peak - current (in cumulative PnL terms).
 */
export function computeDrawdown(entries: JournalEntry[]): DrawdownResult {
  const trades = entries
    .filter((e) => isPnlKind(e.kind) && e.pnl != null)
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  if (trades.length === 0) {
    return { maxDrawdown: 0, currentDrawdown: 0, peakPnl: 0, currentPnl: 0, drawdownPct: 0 };
  }

  let cumulative = 0;
  let peak = 0;
  let maxDD = 0;

  for (const t of trades) {
    cumulative += t.pnl ?? 0;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }

  const currentDrawdown = Math.max(0, peak - cumulative);
  const drawdownPct = peak > 0 ? (currentDrawdown / peak) * 100 : 0;

  return {
    maxDrawdown: maxDD,
    currentDrawdown,
    peakPnl: peak,
    currentPnl: cumulative,
    drawdownPct,
  };
}

/**
 * Position sizing calculator (v3 P1).
 *
 * lotSize = (accountSize × riskPct) / |entry - stopLoss|
 */
export interface SizingInput {
  accountSize: number;
  riskPct: number;       // e.g. 1 = 1%
  entryPrice: number;
  stopLoss: number;
  side: string;          // BUY or SELL
}

export interface SizingResult {
  riskAmount: number;
  lotSize: number;
  positionValue: number;
}

export function calculatePositionSize(input: SizingInput): SizingResult | null {
  const { accountSize, riskPct, entryPrice, stopLoss, side } = input;
  if (!Number.isFinite(accountSize) || !Number.isFinite(riskPct) || !Number.isFinite(entryPrice) || !Number.isFinite(stopLoss)) {
    return null;
  }
  const riskAmount = accountSize * (riskPct / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  if (riskPerUnit === 0) return null;
  const lotSize = riskAmount / riskPerUnit;
  const positionValue = lotSize * entryPrice;
  return { riskAmount, lotSize, positionValue };
}
