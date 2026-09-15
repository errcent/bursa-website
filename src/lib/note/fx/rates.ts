import type { NotePrefs } from "@/lib/note/prefs";

import type { FxRates } from "./types";

export const DEFAULT_USD_IDR = 15_850;

export function normalizeUsdIdrRate(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_USD_IDR;
  if (n < 1_000 || n > 50_000) return DEFAULT_USD_IDR;
  return Math.round(n);
}

export function fxRatesFromPrefs(prefs: Pick<NotePrefs, "usdIdrRate">): FxRates {
  return { usdIdr: normalizeUsdIdrRate(prefs.usdIdrRate) };
}
