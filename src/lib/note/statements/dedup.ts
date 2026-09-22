import crypto from "node:crypto";

import type { Fill } from "@/lib/note/position/types";

/**
 * Content-hash dedup for imports (clean-room).
 *
 * A fill's identity is its economics: ticker, side, size, price, instant.
 * Re-importing the same statement yields identical hashes and is a no-op.
 * Hashes are stored per user (bounded) so dedup survives across runs.
 */

export function fillHash(fill: Pick<Fill, "ticker" | "side" | "size" | "price" | "filledAt">): string {
  const canonical = [fill.ticker, fill.side, fill.size, fill.price, fill.filledAt].join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export function dedupFills(fills: Fill[], known: Set<string>): { fresh: Fill[]; dupes: number } {
  const fresh: Fill[] = [];
  let dupes = 0;
  const seen = new Set<string>();
  for (const fill of fills) {
    const hash = fillHash(fill);
    if (known.has(hash) || seen.has(hash)) {
      dupes += 1;
      continue;
    }
    seen.add(hash);
    fresh.push(fill);
  }
  return { fresh, dupes };
}

export const IMPORT_HASHES_BLOB = "import-hashes";
export const IMPORT_HASHES_CAP = 5000;
export const IMPORT_REVIEW_BLOB = "import-review";
export const IMPORT_REVIEW_CAP = 200;

export interface ReviewItem {
  ref: string;
  reason: string;
  detail: string;
  at: string;
}

/** Stable hash for a trade-grain row so re-imports are idempotent. */
export function tradeRowHash(row: {
  symbol: string;
  side: string;
  qty: number | null;
  entryPrice: number | null;
  exitPrice: number | null;
  pnl: number | null;
  openedAt: string | null;
}): string {
  const canonical = [row.symbol, row.side, row.qty, row.entryPrice, row.exitPrice, row.pnl, row.openedAt]
    .map((v) => String(v ?? ""))
    .join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export function mergeHashes(known: string[], fresh: Fill[]): string[] {
  const next = [...known];
  const set = new Set(known);
  for (const fill of fresh) {
    const hash = fillHash(fill);
    if (!set.has(hash)) {
      set.add(hash);
      next.push(hash);
    }
  }
  return next.slice(-IMPORT_HASHES_CAP);
}
