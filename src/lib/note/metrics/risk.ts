/**
 * Risk metrics (wraps drawdown.ts + R multiples, no rewrites).
 * Drawdown, recovery, R expectancy, fee drag.
 */

import { computeDrawdown, type DrawdownResult } from "@/lib/note/drawdown";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

export interface RiskMetrics {
  drawdown: DrawdownResult;
  /** Net P&L / max drawdown. Null when no drawdown yet. */
  recoveryFactor: number | null;
  /** Mean realized R across stopped trades. */
  avgRealizedR: number | null;
  stoppedTrades: number;
  /** Total fees / gross profit. Null when no gross profit. */
  feeDragRatio: number | null;
}

export function computeRiskMetrics(entries: JournalEntry[]): RiskMetrics {
  const closed = entries.filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open");
  const drawdown = computeDrawdown(entries);
  const net = closed.reduce((a, e) => a + (e.pnl ?? 0), 0);
  const rs = closed
    .map((e) => e.actualRR)
    .filter((r): r is number => r != null && Number.isFinite(r));
  const grossProfit = closed.reduce((a, e) => a + Math.max(0, e.pnl ?? 0), 0);
  const totalFees = closed.reduce((a, e) => a + Math.abs(e.fees ?? 0), 0);
  return {
    drawdown,
    recoveryFactor: drawdown.maxDrawdown > 0 ? net / drawdown.maxDrawdown : null,
    avgRealizedR: rs.length > 0 ? rs.reduce((a, b) => a + b, 0) / rs.length : null,
    stoppedTrades: rs.length,
    feeDragRatio: grossProfit > 0 ? totalFees / grossProfit : null,
  };
}
