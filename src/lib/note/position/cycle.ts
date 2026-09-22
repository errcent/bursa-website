import { closeCycle, emptyPosition, type OpenPosition } from "./finalize";
import { FLAT_TOL, matchLots, openSizeOf } from "./matcher";
import type { CycleMethod, Fill, PositionCycle } from "./types";

export interface BuildCyclesOptions {
  method?: CycleMethod;
  /** Per-ticker point value (futures point value, contract size). Defaults to 1. */
  pointValues?: Record<string, number>;
}

function compareFills(a: Fill, b: Fill): number {
  const byTime = Date.parse(a.filledAt) - Date.parse(b.filledAt);
  if (byTime !== 0) return byTime;
  const orderA = a.sequence ?? Number.POSITIVE_INFINITY;
  const orderB = b.sequence ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Build position cycles (flat-to-flat holding periods) from raw fills.
 *
 * Defended invariants:
 * - A print crossing through flat splits: the closing share finalizes the
 *   cycle, the remainder opens a fresh cycle the other way, fees pro-rata.
 * - A finished cycle's total P&L never depends on the match method; the
 *   method only moves attribution between exit slices.
 * - Fills sort by filledAt, then sequence, then id — deterministic output.
 * - Declared statement gross is honored per slice but its variance against
 *   implied gross is accumulated on the cycle for review (never hidden).
 */
export function buildPositionCycles(
  fills: Fill[],
  options: BuildCyclesOptions = {},
): PositionCycle[] {
  const method = options.method ?? "fifo";
  const cycles: PositionCycle[] = [];
  const seenRefs = new Map<string, number>();

  const buckets = new Map<string, Fill[]>();
  for (const fill of fills) {
    const key = `${fill.accountRef}${fill.ticker}${fill.batchTag ?? ""}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(fill);
    else buckets.set(key, [fill]);
  }

  for (const bucket of buckets.values()) {
    bucket.sort(compareFills);
    const head = bucket[0]!;
    const pointValue = options.pointValues?.[head.ticker];
    const mult = pointValue ?? 1;

    let open: OpenPosition | null = null;

    for (const fill of bucket) {
      let signed = fill.side === "buy" ? fill.size : -fill.size;
      let feeLeft = fill.fee;
      let counted = false;

      while (Math.abs(signed) > FLAT_TOL) {
        if (!open) open = emptyPosition(signed > 0 ? "long" : "short", fill.filledAt);

        const addsExposure =
          (open.direction === "long" && signed > 0) ||
          (open.direction === "short" && signed < 0);

        if (!counted) {
          open.fillIds.push(fill.id);
          open.fillCount += 1;
          counted = true;
        } else if (!open.fillIds.includes(fill.id)) {
          open.fillIds.push(fill.id);
          open.fillCount += 1;
        }

        if (addsExposure) {
          const size = Math.abs(signed);
          open.lots.push({ size, price: fill.price });
          open.entrySize += size;
          open.entryValue += size * fill.price;
          open.fees += feeLeft;
          feeLeft = 0;
          signed = 0;
        } else {
          const held = openSizeOf(open.lots);
          const exitSize = Math.min(Math.abs(signed), held);
          const { matchedValue, rest } = matchLots(open.lots, exitSize, method);
          open.lots = rest;
          const exitValue = exitSize * fill.price;
          const implied =
            open.direction === "long"
              ? (exitValue - matchedValue) * mult
              : (matchedValue - exitValue) * mult;
          const declared = fill.declaredGross;
          const sliceGross = declared ?? implied;
          if (declared != null && Number.isFinite(declared)) {
            open.grossVariance += declared - implied;
          }

          const feeShare =
            Math.abs(signed) > 0 ? feeLeft * (exitSize / Math.abs(signed)) : 0;
          open.gross += sliceGross;
          open.fees += feeShare;
          feeLeft -= feeShare;
          open.exitSize += exitSize;
          open.exitValue += exitValue;
          open.slices.push({ fillId: fill.id, realizedGross: sliceGross, size: exitSize });

          signed += open.direction === "long" ? exitSize : -exitSize;

          if (openSizeOf(open.lots) <= FLAT_TOL) {
            cycles.push(sealCycle(open, head, fill.filledAt, seenRefs, pointValue));
            open = null;
          }
        }
      }

      if (feeLeft !== 0 && open) open.fees += feeLeft;
    }

    if (open) cycles.push(sealCycle(open, head, undefined, seenRefs, pointValue));
  }

  cycles.sort((a, b) =>
    Date.parse(a.openedAt) - Date.parse(b.openedAt) || (a.ref < b.ref ? -1 : 1),
  );
  return cycles;
}

function sealCycle(
  open: OpenPosition,
  head: Fill,
  closedAt: string | undefined,
  seenRefs: Map<string, number>,
  pointValue?: number,
): PositionCycle {
  const base =
    `${head.accountRef}|${head.ticker}|${open.direction}|${open.openedAt}` +
    (head.batchTag ? `|batch:${encodeURIComponent(head.batchTag)}` : "");
  const n = seenRefs.get(base) ?? 0;
  seenRefs.set(base, n + 1);
  return closeCycle(open, {
    ref: n === 0 ? base : `${base}|${n}`,
    accountRef: head.accountRef,
    ticker: head.ticker,
    closedAt,
    pointValue,
  });
}
