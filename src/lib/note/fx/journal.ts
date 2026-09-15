import type { DisplayCurrency } from "@/lib/note/prefs";
import type { JournalEntry } from "@/lib/note/types";

import { convertMoney } from "./convert";
import type { FxRates, MoneyCurrency } from "./types";

const IDX_TICKERS = new Set(["BBCA", "BBRI", "TLKM", "ASII", "BMRI", "BBNI", "UNVR", "GOTO"]);

/** Infer storage currency when entry.currency is missing (legacy rows). */
export function inferJournalCurrency(symbol: string): MoneyCurrency {
  const s = symbol.trim().toUpperCase();
  if (!s) return "IDR";
  if (IDX_TICKERS.has(s)) return "IDR";
  if (/USD$|USDT$/.test(s)) return "USD";
  if (/^[A-Z]{6}$/.test(s)) return "USD";
  if (s === "XAUUSD" || s === "XAGUSD") return "USD";
  return "IDR";
}

export function entryMoneyCurrency(entry: Pick<JournalEntry, "symbol" | "currency">): MoneyCurrency {
  const c = entry.currency;
  if (c === "USD" || c === "USDT" || c === "IDR") return c;
  return inferJournalCurrency(entry.symbol);
}

export function entryPnlInDisplay(
  entry: Pick<JournalEntry, "pnl" | "symbol" | "currency">,
  display: DisplayCurrency,
  rates: FxRates
): number {
  const raw = entry.pnl ?? 0;
  const from = entryMoneyCurrency(entry);
  return convertMoney(raw, from, display, rates);
}
