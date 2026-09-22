/**
 * Bursa Edge Dialect — open composite performance score (0-100), v1.
 *
 * Clean-room design calibrated for Indonesian retail flow (forex + IDX +
 * crypto): fee drag and R-expectancy are first-class because spreads and
 * commissions dominate small accounts. Every threshold below is documented
 * here and pinned to BURSA_EDGE_VERSION; changing any of them bumps the
 * version so historical scores stay comparable.
 *
 * Components (0-100 each, explicit full-marks bar, fixed weights):
 * - winRate:      full at 55% wins (w15)
 * - profitFactor: full at 2.5 gross-profit-per-gross-loss (w25)
 * - expectancyR:  full at +1.0R mean realized R (w20); neutral 50 with <3 R samples
 * - feeDrag:      full at fees <= 2% of gross profit, zero at >= 15% (w10)
 * - drawdown:     full at 0, zero when max drawdown >= 50% of gross profit (w15)
 * - consistency:  full when best day <= 20% of total day profits (w15)
 *
 * Score = weighted mean, 2 decimals, withheld (null) under 10 closed trades.
 * A 90 on 10 trades still means less than a 65 on 600 — trade count ships
 * alongside the score everywhere it is shown.
 */

import { dayKey } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

export const BURSA_EDGE_VERSION = 1;
export const BURSA_EDGE_MIN_TRADES = 10;

export interface EdgeDialectComponents {
  winRate: number;
  profitFactor: number;
  expectancyR: number;
  feeDrag: number;
  drawdown: number;
  consistency: number;
}

export interface EdgeDialect {
  version: number;
  score: number | null;
  components: EdgeDialectComponents;
  closedTrades: number;
}

export const BURSA_EDGE_WEIGHTS: Record<keyof EdgeDialectComponents, number> = {
  winRate: 15,
  profitFactor: 25,
  expectancyR: 20,
  feeDrag: 10,
  drawdown: 15,
  consistency: 15,
};

const clamp01 = (v: number): number => Math.min(Math.max(v, 0), 1);

function outcomeOf(pnl: number, result: JournalEntry["result"]): "win" | "loss" | "flat" {
  if (result === "win" || result === "loss" || result === "be") {
    return result === "be" ? "flat" : result;
  }
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "flat";
}

export function computeEdgeDialect(entries: JournalEntry[]): EdgeDialect {
  const closed = entries.filter(
    (e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open",
  );

  const empty: EdgeDialectComponents = {
    winRate: 0,
    profitFactor: 0,
    expectancyR: 50,
    feeDrag: 100,
    drawdown: 100,
    consistency: 0,
  };
  if (closed.length === 0) {
    return { version: BURSA_EDGE_VERSION, score: null, components: empty, closedTrades: 0 };
  }

  let wins = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalFees = 0;
  const rSamples: number[] = [];
  for (const e of closed) {
    const pnl = e.pnl ?? 0;
    if (outcomeOf(pnl, e.result) === "win") wins += 1;
    if (pnl > 0) grossProfit += pnl;
    else grossLoss -= pnl;
    totalFees += Math.abs(e.fees ?? 0);
    const r = e.actualRR;
    if (r != null && Number.isFinite(r)) rSamples.push(r);
  }

  const winRate = clamp01(wins / closed.length / 0.55) * 100;

  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 2.5 : 0;
  const profitFactor = clamp01(pf / 2.5) * 100;

  const expectancyR =
    rSamples.length >= 3
      ? clamp01(rSamples.reduce((a, b) => a + b, 0) / rSamples.length / 1.0) * 100
      : 50;

  const dragRatio = grossProfit > 0 ? totalFees / grossProfit : 0;
  const feeDrag = (1 - clamp01((dragRatio - 0.02) / (0.15 - 0.02))) * 100;

  const ordered = [...closed].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  let cum = 0;
  let peak = 0;
  let maxDD = 0;
  for (const e of ordered) {
    cum += e.pnl ?? 0;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }
  const drawdown =
    grossProfit > 0 ? (1 - clamp01(maxDD / grossProfit / 0.5)) * 100 : 50;

  const byDay = new Map<string, number>();
  for (const e of closed) {
    const k = dayKey(e.openedAt);
    byDay.set(k, (byDay.get(k) ?? 0) + (e.pnl ?? 0));
  }
  const dayProfits = [...byDay.values()].filter((v) => v > 0);
  const totalDayProfit = dayProfits.reduce((a, b) => a + b, 0);
  const concentration =
    totalDayProfit > 0 ? Math.max(...dayProfits) / totalDayProfit : null;
  const consistency =
    concentration === null
      ? 0
      : concentration <= 0.2
        ? 100
        : (1 - clamp01((concentration - 0.2) / 0.8)) * 100;

  const components: EdgeDialectComponents = {
    winRate,
    profitFactor,
    expectancyR,
    feeDrag,
    drawdown,
    consistency,
  };
  const totalWeight = Object.values(BURSA_EDGE_WEIGHTS).reduce((a, b) => a + b, 0);
  const weighted =
    (Object.keys(components) as (keyof EdgeDialectComponents)[]).reduce(
      (sum, k) => sum + components[k] * BURSA_EDGE_WEIGHTS[k],
      0,
    ) / totalWeight;

  return {
    version: BURSA_EDGE_VERSION,
    score: closed.length >= BURSA_EDGE_MIN_TRADES ? Math.round(weighted * 100) / 100 : null,
    components,
    closedTrades: closed.length,
  };
}
