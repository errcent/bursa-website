import type { Portfolio, TrackStore, TrackTransaction } from "@/lib/note/track/types";

const P1 = "demo-portfolio-core";
const P2 = "demo-portfolio-id";

function tx(
  partial: Omit<TrackTransaction, "id" | "createdAt"> & { id?: string }
): TrackTransaction {
  const id = partial.id ?? `demo-tx-${partial.portfolioId}-${partial.executedAt}-${partial.symbol}`;
  return {
    ...partial,
    id,
    createdAt: partial.executedAt,
  };
}

export function buildDemoTrackStore(): TrackStore {
  const portfolios: Portfolio[] = [
    { id: P1, name: "Core crypto & FX", createdAt: "2026-06-01T08:00:00+07:00" },
    { id: P2, name: "Saham IDX", createdAt: "2026-07-15T09:00:00+07:00" },
  ];

  const transactions: TrackTransaction[] = [
    tx({
      portfolioId: P1,
      type: "buy",
      symbol: "BTCUSD",
      quantity: 0.05,
      unitPrice: 62000,
      quoteCurrency: "USD",
      fee: 12,
      note: "DCA bulanan",
      executedAt: "2026-06-05T10:30:00+07:00",
    }),
    tx({
      portfolioId: P1,
      type: "buy",
      symbol: "ETHUSD",
      quantity: 1.2,
      unitPrice: 3200,
      quoteCurrency: "USD",
      fee: 8,
      note: null,
      executedAt: "2026-06-12T14:00:00+07:00",
    }),
    tx({
      portfolioId: P1,
      type: "buy",
      symbol: "XAUUSD",
      quantity: 0.1,
      unitPrice: 2350,
      quoteCurrency: "USD",
      fee: 4,
      note: "Hedge",
      executedAt: "2026-07-01T09:15:00+07:00",
    }),
    tx({
      portfolioId: P1,
      type: "sell",
      symbol: "ETHUSD",
      quantity: 0.4,
      unitPrice: 3400,
      quoteCurrency: "USD",
      fee: 6,
      note: "Partial take profit",
      executedAt: "2026-08-10T11:00:00+07:00",
    }),
    tx({
      portfolioId: P1,
      type: "transfer_in",
      symbol: "EURUSD",
      quantity: 10000,
      unitPrice: 1.08,
      quoteCurrency: "USD",
      fee: 0,
      note: "Transfer in dari wallet",
      executedAt: "2026-08-20T16:00:00+07:00",
    }),
    tx({
      portfolioId: P2,
      type: "buy",
      symbol: "BBCA",
      quantity: 100,
      unitPrice: 9850,
      quoteCurrency: "IDR",
      fee: 15000,
      note: null,
      executedAt: "2026-07-20T10:00:00+07:00",
    }),
    tx({
      portfolioId: P2,
      type: "buy",
      symbol: "BBRI",
      quantity: 200,
      unitPrice: 4520,
      quoteCurrency: "IDR",
      fee: 12000,
      note: null,
      executedAt: "2026-08-01T13:30:00+07:00",
    }),
    tx({
      portfolioId: P2,
      type: "buy",
      symbol: "BBCA",
      quantity: 50,
      unitPrice: 10100,
      quoteCurrency: "IDR",
      fee: 8000,
      note: "Top up",
      executedAt: "2026-09-02T09:45:00+07:00",
    }),
    tx({
      portfolioId: P2,
      type: "sell",
      symbol: "BBRI",
      quantity: 50,
      unitPrice: 4700,
      quoteCurrency: "IDR",
      fee: 9000,
      note: "Rebalance",
      executedAt: "2026-09-10T15:00:00+07:00",
    }),
  ];

  return { version: 1, portfolios, transactions };
}
