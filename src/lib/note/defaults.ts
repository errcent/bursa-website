/**
 * Journal defaults (per user).
 *
 * Breakeven tolerance, fallback fees, global multipliers, and statement
 * timezone. Applied at import/sync time and surfaced in Settings —
 * never silently rewritten afterwards.
 */

import { isValidTimezone } from "@/lib/note/statements/timezone";

export interface JournalDefaults {
  /** |pnl| at or under this counts as breakeven. */
  breakevenBand: number;
  /** Fee applied when a row carries none. */
  defaultFee: number;
  /** Global per-ticker multipliers (account multipliers win on conflict). */
  multipliers: Record<string, number>;
  /** IANA zone for naive statement timestamps. */
  statementTz: string;
}

export const JOURNAL_DEFAULTS_BLOB = "journal-defaults";

export const DEFAULT_JOURNAL_DEFAULTS: JournalDefaults = {
  breakevenBand: 0,
  defaultFee: 0,
  multipliers: {},
  statementTz: "Asia/Jakarta",
};

export function normalizeDefaults(raw: unknown): JournalDefaults {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number, max: number): number => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || n < 0 || n > max) return fallback;
    return n;
  };
  const multipliers: Record<string, number> = {};
  if (o.multipliers && typeof o.multipliers === "object") {
    for (const [ticker, mult] of Object.entries(o.multipliers as Record<string, unknown>)) {
      const key = ticker.trim().toUpperCase();
      const value = typeof mult === "number" ? mult : Number(mult);
      if (key && Number.isFinite(value) && value > 0 && value <= 1_000_000) multipliers[key] = value;
    }
  }
  const statementTz = typeof o.statementTz === "string" && isValidTimezone(o.statementTz) ? o.statementTz : "Asia/Jakarta";
  return {
    breakevenBand: num(o.breakevenBand, 0, 1_000_000),
    defaultFee: num(o.defaultFee, 0, 1_000_000),
    multipliers,
    statementTz,
  };
}
