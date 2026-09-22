import type { CreateEntryInput, JournalResult } from "../types";
import type { PositionCycle } from "./types";

/**
 * Bridge position cycles into journal entries (import path).
 * One cycle → one TRADE entry. Variance flags ride along in the note
 * so reviewers see declared-vs-implied gaps instead of losing them.
 */
export function cyclesToEntries(
  cycles: PositionCycle[],
  opts: { accountLabel?: string; notePrefix?: string } = {},
): CreateEntryInput[] {
  return cycles.map((c) => {
    const result: JournalResult | null =
      c.outcome === "open" ? "open" : c.outcome === "flat" ? "be" : c.outcome === "win" ? "win" : "loss";
    const varianceFlag =
      Math.abs(c.grossVariance) >= 0.01
        ? ` [variance ${c.grossVariance >= 0 ? "+" : ""}${c.grossVariance.toFixed(2)} vs statement]`
        : "";
    const note =
      (opts.notePrefix ? `${opts.notePrefix} ` : "") +
      `Cycle ${c.direction} ${c.ticker} · ${c.fillCount} fills${varianceFlag}`;
    return {
      kind: "TRADE",
      mode: "cepat",
      symbol: c.ticker,
      side: c.direction === "long" ? "BUY" : "SELL",
      qty: c.entrySize,
      entryPrice: c.meanEntry,
      exitPrice: c.meanExit ?? null,
      fees: c.fees,
      pnl: c.outcome === "open" ? null : c.net,
      result,
      note: note.trim() || null,
      accountLabel: opts.accountLabel ?? c.accountRef,
      openedAt: c.openedAt,
    };
  });
}
