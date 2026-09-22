/**
 * MAE/MFE excursion estimates (clean-room).
 *
 * Estimated gross unrealized equity path over a holding period from
 * observed candles + entry price. HONESTY CONTRACT (surfaced in UI):
 * estimated from observed candles only, excludes fees and FX conversion,
 * withheld when fewer than 3 usable candles or when gaps dominate.
 * Never presented as tick-perfect.
 */

import type { Candle } from "@/lib/note/market/candles";

export interface ExcursionInput {
  direction: "long" | "short";
  qty: number;
  entryPrice: number;
  openedAtMs: number;
  closedAtMs: number | null;
}

export interface ExcursionPoint {
  t: number;
  equity: number;
}

export interface ExcursionResult {
  mae: number | null;
  mfe: number | null;
  path: ExcursionPoint[];
  candlesUsed: number;
  gaps: number;
  withheld: string | null;
}

const MIN_USABLE = 3;

export function computeExcursions(input: ExcursionInput, candles: Candle[]): ExcursionResult {
  const { direction, qty, entryPrice, openedAtMs, closedAtMs } = input;
  if (!(qty > 0) || !(entryPrice > 0)) {
    return { mae: null, mfe: null, path: [], candlesUsed: 0, gaps: 0, withheld: "missing-entry" };
  }
  const end = closedAtMs ?? Date.now();
  if (!(end > openedAtMs)) {
    return { mae: null, mfe: null, path: [], candlesUsed: 0, gaps: 0, withheld: "bad-window" };
  }
  // Complete candles strictly inside the window; boundary candles excluded.
  const usable = candles
    .filter((c) => c.t > openedAtMs && c.t < end)
    .sort((a, b) => a.t - b.t);
  if (usable.length < MIN_USABLE) {
    return { mae: null, mfe: null, path: [], candlesUsed: usable.length, gaps: 0, withheld: "low-coverage" };
  }
  const sign = direction === "long" ? 1 : -1;
  const path: ExcursionPoint[] = usable.map((c) => ({
    t: c.t,
    equity: sign * (c.c - entryPrice) * qty,
  }));
  // Gap detection: consecutive step beyond 4x the median step.
  const steps: number[] = [];
  for (let i = 1; i < usable.length; i += 1) steps.push(usable[i]!.t - usable[i - 1]!.t);
  const median = [...steps].sort((a, b) => a - b)[Math.floor(steps.length / 2)] ?? 0;
  const gaps = median > 0 ? steps.filter((s) => s > median * 4).length : 0;
  if (gaps > usable.length / 2) {
    return { mae: null, mfe: null, path: [], candlesUsed: usable.length, gaps, withheld: "gappy" };
  }
  let mae = 0;
  let mfe = 0;
  for (const p of path) {
    if (p.equity < 0) mae = Math.max(mae, -p.equity);
    else mfe = Math.max(mfe, p.equity);
  }
  return { mae, mfe, path, candlesUsed: usable.length, gaps, withheld: null };
}
