/**
 * Journal account entities (clean-room).
 *
 * Named accounts carrying their own position-cycle method and per-ticker
 * contract multipliers. Imports and sync runs resolve the matching account
 * by label; unmatched labels fall back to FIFO with multiplier 1.
 */

import type { CycleMethod } from "@/lib/note/position/types";

export interface JournalAccount {
  id: string;
  label: string;
  method: CycleMethod;
  multipliers: Record<string, number>;
  createdAt: string;
}

export const JOURNAL_ACCOUNTS_BLOB = "journal-accounts";

export function resolveAccount(
  accounts: JournalAccount[],
  label: string | null,
): { method: CycleMethod; pointValues: Record<string, number> } {
  const found = label ? accounts.find((a) => a.label.toLowerCase() === label.toLowerCase()) : undefined;
  if (!found) return { method: "fifo", pointValues: {} };
  const pointValues: Record<string, number> = {};
  for (const [ticker, mult] of Object.entries(found.multipliers ?? {})) {
    if (Number.isFinite(mult) && mult > 0) pointValues[ticker.toUpperCase()] = mult;
  }
  return { method: found.method, pointValues };
}

export function normalizeMultipliers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [ticker, mult] of Object.entries(raw as Record<string, unknown>)) {
    const key = ticker.trim().toUpperCase();
    const value = typeof mult === "number" ? mult : Number(mult);
    if (key && Number.isFinite(value) && value > 0 && value <= 1_000_000) out[key] = value;
  }
  return out;
}
