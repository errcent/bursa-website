export type TrackTxType = "buy" | "sell" | "transfer_in" | "mark";

export type TrackQuoteCurrency = "IDR" | "USD" | "USDT";

export type TrackTransaction = {
  id: string;
  portfolioId: string;
  type: TrackTxType;
  symbol: string;
  quantity: number;
  /** Per-unit price in quoteCurrency; null allowed for transfer_in (uses mark fallback). */
  unitPrice: number | null;
  quoteCurrency: TrackQuoteCurrency;
  fee: number;
  note: string | null;
  executedAt: string;
  createdAt: string;
};

export type Portfolio = {
  id: string;
  name: string;
  createdAt: string;
};

export type TrackStore = {
  version: 1;
  portfolios: Portfolio[];
  transactions: TrackTransaction[];
};

export type TrackRangePreset = "7d" | "30d" | "90d" | "ytd" | "all";

export type HoldingRow = {
  symbol: string;
  quoteCurrency: TrackQuoteCurrency;
  quantity: number;
  avgCost: number;
  markPrice: number;
  /** Value in native quote currency. */
  marketValueNative: number;
  costBasisNative: number;
  /** Values converted to snapshot baseCurrency. */
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPct: number | null;
  weight: number;
};

export type AllocationSlice = {
  symbol: string;
  value: number;
  weight: number;
};

export type AllocationTimePoint = {
  date: string;
  weights: Record<string, number>;
};

export type HistoryPoint = {
  date: string;
  value: number;
};

export type TrackSnapshot = {
  baseCurrency: "IDR" | "USD" | "USDT";
  usdIdrRate: number;
  mixedCurrencies: boolean;
  marketDataUsed?: boolean;
  totalValue: number;
  totalCost: number;
  allTimePnl: number;
  rangePnl: number;
  rangePnlPct: number | null;
  holdings: HoldingRow[];
  allocationNow: AllocationSlice[];
  allocationOverTime: AllocationTimePoint[];
  history: HistoryPoint[];
  /** Mark-to-market P/L vs net capital in (not account notional). */
  pnlHistory: HistoryPoint[];
  bestPerformer: { symbol: string; pct: number } | null;
  worstPerformer: { symbol: string; pct: number } | null;
};
