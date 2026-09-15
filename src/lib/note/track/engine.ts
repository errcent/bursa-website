import { addDays, jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import { convertMoney } from "@/lib/note/fx/convert";
import type { FxRates } from "@/lib/note/fx/types";
import type { DisplayCurrency } from "@/lib/note/prefs";

import { closeOnOrBefore } from "@/lib/note/track/yahoo-history";
import type { DailyCloseSeries } from "@/lib/note/track/yahoo-history";

import type {
  AllocationSlice,
  AllocationTimePoint,
  HistoryPoint,
  HoldingRow,
  TrackRangePreset,
  TrackSnapshot,
  TrackQuoteCurrency,
  TrackTransaction,
} from "@/lib/note/track/types";

type SymbolState = {
  qty: number;
  costTotal: number;
  lastPrice: number;
  quoteCurrency: TrackQuoteCurrency;
};

function emptyState(): Map<string, SymbolState> {
  return new Map();
}

function toBase(
  amount: number,
  from: TrackQuoteCurrency,
  base: DisplayCurrency,
  rates: FxRates
): number {
  return convertMoney(amount, from, base, rates);
}

function replayToDate(
  txns: TrackTransaction[],
  untilIso: string
): Map<string, SymbolState> {
  const sorted = [...txns].sort((a, b) => a.executedAt.localeCompare(b.executedAt));
  const state = emptyState();
  for (const tx of sorted) {
    if (tx.executedAt > untilIso) break;
    const sym = tx.symbol.trim().toUpperCase();
    if (!sym) continue;
    const row = state.get(sym) ?? {
      qty: 0,
      costTotal: 0,
      lastPrice: 0,
      quoteCurrency: tx.quoteCurrency,
    };
    row.quoteCurrency = tx.quoteCurrency;
    const price = tx.unitPrice ?? row.lastPrice ?? 0;

    if (tx.type === "buy" || tx.type === "transfer_in") {
      const q = tx.quantity;
      if (q <= 0) continue;
      row.costTotal += q * price + tx.fee;
      row.qty += q;
      if (price > 0) row.lastPrice = price;
    } else if (tx.type === "sell") {
      const q = Math.min(tx.quantity, row.qty);
      if (q <= 0) continue;
      const avg = row.qty > 0 ? row.costTotal / row.qty : 0;
      row.costTotal -= avg * q;
      row.qty -= q;
      if (tx.unitPrice != null && tx.unitPrice > 0) row.lastPrice = tx.unitPrice;
    } else if (tx.type === "mark") {
      if (row.qty <= 0) continue;
      if (price > 0) row.lastPrice = price;
    }
    state.set(sym, row);
  }
  return state;
}

function resolveMark(
  symbol: string,
  row: SymbolState,
  asOfDate: string,
  marketCloses?: DailyCloseSeries
): number {
  const sym = symbol.trim().toUpperCase();
  const ext = marketCloses?.[sym];
  const yahoo = ext ? closeOnOrBefore(ext, asOfDate) : null;
  if (yahoo != null && yahoo > 0) return yahoo;
  if (row.lastPrice > 0) return row.lastPrice;
  return row.qty > 0 ? row.costTotal / row.qty : 0;
}

function portfolioValue(
  state: Map<string, SymbolState>,
  base: DisplayCurrency,
  rates: FxRates,
  asOfDate: string,
  marketCloses?: DailyCloseSeries
): number {
  let v = 0;
  for (const [symbol, row] of state.entries()) {
    if (row.qty <= 0) continue;
    const mark = resolveMark(symbol, row, asOfDate, marketCloses);
    v += toBase(row.qty * mark, row.quoteCurrency, base, rates);
  }
  return v;
}

function holdingsFromState(
  state: Map<string, SymbolState>,
  base: DisplayCurrency,
  rates: FxRates,
  asOfDate: string,
  marketCloses?: DailyCloseSeries
): HoldingRow[] {
  const rows: HoldingRow[] = [];
  let total = 0;
  for (const [symbol, row] of state.entries()) {
    if (row.qty <= 1e-9) continue;
    const avgCost = row.qty > 0 ? row.costTotal / row.qty : 0;
    const markPrice = resolveMark(symbol, row, asOfDate, marketCloses);
    const marketValueNative = row.qty * markPrice;
    const costBasisNative = row.costTotal;
    const marketValue = toBase(marketValueNative, row.quoteCurrency, base, rates);
    const costBasis = toBase(costBasisNative, row.quoteCurrency, base, rates);
    total += marketValue;
    rows.push({
      symbol,
      quoteCurrency: row.quoteCurrency,
      quantity: row.qty,
      avgCost,
      markPrice,
      marketValueNative,
      costBasisNative,
      marketValue,
      costBasis,
      unrealizedPnl: marketValue - costBasis,
      unrealizedPct: costBasisNative > 0 ? ((marketValueNative - costBasisNative) / costBasisNative) * 100 : null,
      weight: 0,
    });
  }
  for (const h of rows) {
    h.weight = total > 0 ? (h.marketValue / total) * 100 : 0;
  }
  return rows.sort((a, b) => b.marketValue - a.marketValue);
}

function rangeStart(preset: TrackRangePreset, anchor = jakartaDateKey()): string | null {
  if (preset === "all") return null;
  if (preset === "7d") return addDays(anchor, -6);
  if (preset === "30d") return addDays(anchor, -29);
  if (preset === "90d") return addDays(anchor, -89);
  const y = anchor.slice(0, 4);
  return `${y}-01-01`;
}

function netInvested(
  txns: TrackTransaction[],
  base: DisplayCurrency,
  rates: FxRates,
  untilIso?: string
): number {
  let net = 0;
  for (const tx of txns) {
    if (untilIso && tx.executedAt > untilIso) break;
    const price = tx.unitPrice ?? 0;
    if (tx.type === "mark") continue;
    if (tx.type === "buy" || tx.type === "transfer_in") {
      net += toBase(tx.quantity * price + tx.fee, tx.quoteCurrency, base, rates);
    } else if (tx.type === "sell") {
      net -= toBase(tx.quantity * price - tx.fee, tx.quoteCurrency, base, rates);
    }
  }
  return net;
}

function detectMixedCurrencies(txns: TrackTransaction[]): boolean {
  const set = new Set<TrackQuoteCurrency>();
  for (const tx of txns) {
    if (tx.type === "mark") continue;
    set.add(tx.quoteCurrency);
  }
  return set.size > 1;
}

export type BuildTrackSnapshotOpts = {
  range: TrackRangePreset;
  now?: Date;
  baseCurrency: DisplayCurrency;
  rates: FxRates;
  /** Daily closes from Yahoo (symbol → date → price). Overrides txn marks when present. */
  marketCloses?: DailyCloseSeries;
};

export function buildTrackSnapshot(
  txns: TrackTransaction[],
  opts: BuildTrackSnapshotOpts
): TrackSnapshot {
  const { baseCurrency, rates, marketCloses } = opts;
  const anchor = jakartaDateKey(opts.now ?? new Date());
  const endIso = new Date(`${anchor}T23:59:59+07:00`).toISOString();
  const startKey = rangeStart(opts.range, anchor);

  const stateNow = replayToDate(txns, endIso);
  const holdings = holdingsFromState(stateNow, baseCurrency, rates, anchor, marketCloses);
  const totalValue = portfolioValue(stateNow, baseCurrency, rates, anchor, marketCloses);
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const invested = netInvested(txns, baseCurrency, rates);
  const allTimePnl = totalValue - invested;

  let valueStart = totalValue;
  if (startKey) {
    const startIso = new Date(`${startKey}T00:00:00+07:00`).toISOString();
    valueStart = portfolioValue(
      replayToDate(txns, startIso),
      baseCurrency,
      rates,
      startKey,
      marketCloses
    );
  }
  const rangePnl = totalValue - valueStart;
  const rangePnlPct = valueStart > 0 ? (rangePnl / valueStart) * 100 : null;

  const allocationNow: AllocationSlice[] = holdings.map((h) => ({
    symbol: h.symbol,
    value: h.marketValue,
    weight: h.weight,
  }));

  const symbols = [...new Set(holdings.map((h) => h.symbol))];
  const history: HistoryPoint[] = [];
  const pnlHistory: HistoryPoint[] = [];
  const allocationOverTime: AllocationTimePoint[] = [];

  const fromKey = startKey ?? (txns[0]?.executedAt.slice(0, 10) ?? anchor);
  let d = fromKey;
  while (d <= anchor) {
    const iso = new Date(`${d}T23:59:59+07:00`).toISOString();
    const st = replayToDate(txns, iso);
    const val = portfolioValue(st, baseCurrency, rates, d, marketCloses);
    const investedToDate = netInvested(txns, baseCurrency, rates, iso);
    const pnl = val - investedToDate;
    history.push({ date: d, value: Math.round(val * 100) / 100 });
    pnlHistory.push({ date: d, value: Math.round(pnl * 100) / 100 });
    const dayHoldings = holdingsFromState(st, baseCurrency, rates, d, marketCloses);
    const dayTotal = dayHoldings.reduce((s, h) => s + h.marketValue, 0);
    const weights: Record<string, number> = {};
    for (const sym of symbols) weights[sym] = 0;
    for (const h of dayHoldings) {
      weights[h.symbol] = dayTotal > 0 ? (h.marketValue / dayTotal) * 100 : 0;
    }
    allocationOverTime.push({ date: d, weights });
    d = addDays(d, 1);
  }

  const performers = holdings.filter((h) => h.unrealizedPct != null && h.costBasisNative > 0);
  performers.sort((a, b) => (b.unrealizedPct ?? 0) - (a.unrealizedPct ?? 0));
  const bestPerformer = performers[0]
    ? { symbol: performers[0].symbol, pct: performers[0].unrealizedPct! }
    : null;
  const worst = performers[performers.length - 1];
  const worstPerformer =
    worst && worst !== performers[0] ? { symbol: worst.symbol, pct: worst.unrealizedPct! } : null;

  return {
    baseCurrency,
    usdIdrRate: rates.usdIdr,
    mixedCurrencies: detectMixedCurrencies(txns),
    marketDataUsed: Boolean(marketCloses && Object.keys(marketCloses).length),
    totalValue,
    totalCost,
    allTimePnl,
    rangePnl,
    rangePnlPct,
    holdings,
    allocationNow,
    allocationOverTime,
    history,
    pnlHistory,
    bestPerformer,
    worstPerformer,
  };
}

export function mergePortfolioSnapshots(
  snapshots: TrackSnapshot[],
  txns: TrackTransaction[],
  opts: BuildTrackSnapshotOpts
): TrackSnapshot {
  if (snapshots.length === 1) return snapshots[0]!;
  return buildTrackSnapshot(txns, opts);
}
