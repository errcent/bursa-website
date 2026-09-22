/**
 * Paste-a-trade parser (v3 P0).
 *
 * Parses a single trade line into a CreateEntryInput.
 * Zero-friction capture: paste, don't type.
 *
 * Supported formats (auto-detected):
 *
 * 1. Free-form: "BUY EURUSD 0.1 @1.0850 SL 1.0820 TP 1.0920"
 *    "SELL XAUUSD 0.5 @2350 sl 2340 tp 2380 pnl +120"
 *
 * 2. Compact: "B EURUSD 0.1 1.0850 1.0820 1.0920"
 *    (side symbol qty entry sl tp)
 *
 * 3. With PnL: "BUY EURUSD @1.0850 SL 1.0820 TP 1.0920 +120"
 *
 * 4. Minimal: "EURUSD BUY 0.1" (just symbol + side + qty)
 *
 * Returns null if the line cannot be parsed.
 */

import type { CreateEntryInput } from "@/lib/note/types";

export interface ParsedTrade {
  side: string;
  symbol: string;
  qty: number | null;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
  accountLabel: string | null;
  raw: string;
}

const SIDE_PATTERNS: Record<string, string> = {
  buy: "BUY",
  long: "BUY",
  b: "BUY",
  sell: "SELL",
  short: "SELL",
  s: "SELL",
  hold: "HOLD",
  h: "HOLD",
  dca: "DCA",
};

function tok(input: string): string[] {
  return input
    .trim()
    .replace(/[@=]/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);
}

function isNumber(s: string): boolean {
  if (s === "") return false;
  return !isNaN(Number(s));
}

function parseSide(s: string): string | null {
  const key = s.toLowerCase();
  return SIDE_PATTERNS[key] ?? null;
}

function isSymbol(s: string): boolean {
  // Symbols: uppercase letters, maybe with : or / (FX:EURUSD, BTC/USDT)
  return /^[A-Z][A-Z0-9:/._-]{1,20}$/i.test(s) && !isNumber(s) && parseSide(s) === null;
}

/**
 * Parse a single trade line.
 * Returns ParsedTrade or null.
 */
export function parseTradeLine(line: string): ParsedTrade | null {
  const raw = line.trim();
  if (!raw) return null;

  const tokens = tok(raw);
  if (tokens.length < 2) return null;

  let idx = 0;
  let side = "BUY";
  let symbol = "";
  let qty: number | null = null;
  let entryPrice: number | null = null;
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;
  let pnl: number | null = null;
  let accountLabel: string | null = null;

  // Try to parse side from first token
  const firstSide = parseSide(tokens[0]);
  if (firstSide) {
    side = firstSide;
    idx = 1;
  }

  // Next token should be symbol
  if (tokens[idx] && isSymbol(tokens[idx])) {
    symbol = tokens[idx].toUpperCase();
    idx++;
  } else {
    return null; // no symbol = can't parse
  }

  // Scan remaining tokens for qty, prices, SL, TP, PnL, account
  let pendingPrice: "entry" | "sl" | "tp" | null = null;
  for (; idx < tokens.length; idx++) {
    const t = tokens[idx];
    const lower = t.toLowerCase();

    // Keyword markers
    if (lower === "sl" || lower === "stop" || lower === "stoploss") {
      pendingPrice = "sl";
      continue;
    }
    if (lower === "tp" || lower === "target" || lower === "takeprofit") {
      pendingPrice = "tp";
      continue;
    }
    if (lower === "pnl" || lower === "p" || lower === "profit") {
      pendingPrice = null;
      // next number is PnL
      if (tokens[idx + 1] && isNumber(tokens[idx + 1])) {
        pnl = Number(tokens[++idx]);
      }
      continue;
    }
    if (lower === "acct" || lower === "account" || lower === "akun") {
      pendingPrice = null;
      if (tokens[idx + 1]) {
        accountLabel = tokens[++idx];
      }
      continue;
    }

    // Number token
    if (isNumber(t)) {
      const n = Number(t);
      if (pendingPrice === "sl") {
        stopLoss = n;
        pendingPrice = null;
      } else if (pendingPrice === "tp") {
        takeProfit = n;
        pendingPrice = null;
      } else if (qty === null && n > 0 && n < 100000 && !Number.isInteger(n)) {
        // likely qty (decimal, small)
        qty = n;
      } else if (entryPrice === null) {
        entryPrice = n;
      } else if (stopLoss === null) {
        // second bare number after entry = SL
        stopLoss = n;
      } else if (takeProfit === null) {
        takeProfit = n;
      } else if (pnl === null) {
        pnl = n;
      }
      continue;
    }

    // Non-number, non-keyword = maybe account label or note
    if (!accountLabel && !isNumber(t) && parseSide(t) === null) {
      accountLabel = t;
    }
  }

  if (!symbol) return null;

  return { side, symbol, qty, entryPrice, stopLoss, takeProfit, pnl, accountLabel, raw };
}

/**
 * Parse multiple trade lines (one per line).
 * Returns { trades, errors } where errors is line numbers that failed.
 */
export function parseTradeLines(text: string): {
  trades: ParsedTrade[];
  errors: number[];
} {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const trades: ParsedTrade[] = [];
  const errors: number[] = [];

  lines.forEach((line, i) => {
    const parsed = parseTradeLine(line);
    if (parsed) trades.push(parsed);
    else errors.push(i + 1);
  });

  return { trades, errors };
}

/**
 * Convert ParsedTrade to CreateEntryInput for the API.
 */
export function parsedToCreateInput(
  parsed: ParsedTrade,
  opts: { kind?: "TRADE" | "INVEST"; mode?: "cepat" | "review"; openedAt?: string } = {}
): CreateEntryInput {
  return {
    kind: opts.kind ?? "TRADE",
    mode: opts.mode ?? "cepat",
    symbol: parsed.symbol,
    side: parsed.side,
    qty: parsed.qty,
    entryPrice: parsed.entryPrice,
    stopLoss: parsed.stopLoss,
    takeProfit: parsed.takeProfit,
    pnl: parsed.pnl,
    accountLabel: parsed.accountLabel,
    openedAt: opts.openedAt ?? null,
  };
}
