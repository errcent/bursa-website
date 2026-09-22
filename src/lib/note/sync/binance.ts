/**
 * Binance Spot read-only sync (BYOK).
 *
 * Uses the user's own API key/secret with HMAC-SHA256 request signing.
 * Only trade-history endpoints are ever called (myTrades). No order,
 * withdraw, or account-modify endpoints exist in this module by design.
 */

import crypto from "node:crypto";

import type { Fill } from "@/lib/note/position/types";
import type { BinanceCredentials, BrokerFetchResult } from "./types";

const HOST = "https://api.binance.com";
const RECV_WINDOW = 60_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_TRADES_PER_SYMBOL = 1000;

export function signQuery(query: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

async function signedGet(path: string, params: Record<string, string>, creds: BinanceCredentials): Promise<unknown> {
  const query = new URLSearchParams({ ...params, timestamp: String(Date.now()), recvWindow: String(RECV_WINDOW) });
  const signature = signQuery(query.toString(), creds.apiSecret);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${HOST}${path}?${query.toString()}&signature=${signature}`, {
      headers: { "X-MBX-APIKEY": creds.apiKey },
      signal: controller.signal,
    });
    if (!res.ok) {
      const code = res.status;
      // Never relay upstream bodies (may echo key material in errors).
      throw new Error(`Binance rejected the request (HTTP ${code}).`);
    }
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

interface BinanceTradeRow {
  symbol: string;
  id: number;
  price: string;
  qty: string;
  commission: string;
  time: number;
  isBuyer: boolean;
}

function rowToFill(row: BinanceTradeRow, accountRef: string): Fill | null {
  const price = Number(row.price);
  const size = Number(row.qty);
  if (!row.symbol || !Number.isFinite(price) || !Number.isFinite(size) || size <= 0) return null;
  const filledAt = new Date(row.time);
  if (Number.isNaN(filledAt.getTime())) return null;
  const fee = Number(row.commission);
  return {
    id: `binance-${row.symbol}-${row.id}`,
    accountRef,
    ticker: row.symbol,
    side: row.isBuyer ? "buy" : "sell",
    size,
    price,
    fee: Number.isFinite(fee) ? Math.abs(fee) : 0,
    filledAt: filledAt.toISOString(),
    origin: "sync",
    sequence: row.id,
  };
}

export async function fetchBinanceFills(
  creds: BinanceCredentials,
  symbols: string[],
  accountRef: string,
  opts: { startTime?: number } = {},
): Promise<BrokerFetchResult> {
  const fills: Fill[] = [];
  let skipped = 0;
  const errors: string[] = [];
  const clean = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 20);
  if (clean.length === 0) {
    return { fills, skipped, errors: ["Add at least one symbol (e.g. BTCUSDT)."] };
  }
  for (const symbol of clean) {
    try {
      const params: Record<string, string> = { symbol, limit: String(MAX_TRADES_PER_SYMBOL) };
      if (opts.startTime) params.startTime = String(opts.startTime);
      const rows = (await signedGet("/api/v3/myTrades", params, creds)) as BinanceTradeRow[];
      if (!Array.isArray(rows)) {
        errors.push(`${symbol}: unexpected response shape.`);
        continue;
      }
      for (const row of rows) {
        const fill = rowToFill(row, accountRef);
        if (fill) fills.push(fill);
        else skipped += 1;
      }
    } catch (error) {
      errors.push(`${symbol}: ${error instanceof Error ? error.message : "fetch failed"}`);
    }
  }
  return { fills, skipped, errors };
}
