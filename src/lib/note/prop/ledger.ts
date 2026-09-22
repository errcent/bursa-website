/**
 * Prop firm cash ledger (clean-room).
 *
 * Tracks the cash economics of prop trading separately from trade P&L:
 * what was paid, refunded, requested, and actually received. Currencies
 * are never auto-converted — every total is per-currency.
 */

export type PropPhase = "evaluation" | "verification" | "funded" | "instant" | "live";
export type PropAccountStatus = "active" | "passed" | "breached" | "closed" | "archived";
export type PropPayoutStatus = "requested" | "approved" | "completed" | "rejected" | "cancelled";
export type PropFlowKind = "expense" | "refund";

export interface PropAccount {
  id: string;
  firm: string;
  name: string;
  currency: string;
  phase: PropPhase;
  status: PropAccountStatus;
  nominalSize: number | null;
  openedAt: string;
  renewalDate: string | null;
  notes: string | null;
}

export interface PropCashFlow {
  id: string;
  accountId: string | null;
  firm: string;
  kind: PropFlowKind;
  category: string;
  amount: number;
  currency: string;
  date: string;
  expenseId: string | null;
  reference: string | null;
  notes: string | null;
  void: boolean;
}

export interface PropReceipt {
  amount: number;
  date: string;
  reference: string | null;
}

export interface PropPayout {
  id: string;
  accountId: string;
  requestedAt: string;
  requestedGross: number;
  /** Trader share in percent, e.g. 90. Enter 100 when already net. */
  traderSharePct: number;
  expectedFee: number;
  expectedAt: string | null;
  status: PropPayoutStatus;
  receipts: PropReceipt[];
  reversals: PropReceipt[];
}

export interface PropLedger {
  accounts: PropAccount[];
  flows: PropCashFlow[];
  payouts: PropPayout[];
}

export const EMPTY_PROP_LEDGER: PropLedger = { accounts: [], flows: [], payouts: [] };

export const PROP_LEDGER_BLOB = "prop-ledger";

export interface PropCashTotals {
  spent: number;
  refunds: number;
  netSpend: number;
  received: number;
  netCash: number;
  /** Net cash / net spend × 100. Null when net spend is not positive. */
  cashROI: number | null;
  outstanding: number;
  pending: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Expected net of one payout: round(requested × share) − expected fee. */
export function expectedPayoutNet(payout: PropPayout): number {
  return Math.max(0, round2((payout.requestedGross * payout.traderSharePct) / 100) - payout.expectedFee);
}

function netReceipts(payout: PropPayout): number {
  const got = payout.receipts.reduce((a, r) => a + r.amount, 0);
  const back = payout.reversals.reduce((a, r) => a + r.amount, 0);
  return got - back;
}

/**
 * Per-currency cash totals. Requests and approvals contribute zero —
 * only settled receipts count as received. Shared (account-less) flows
 * count toward firm/overall totals only, never a single account.
 */
export function summarizePropLedger(ledger: PropLedger, accountId?: string): Record<string, PropCashTotals> {
  const flows = ledger.flows.filter((f) => !f.void && (!accountId || f.accountId === accountId));
  const payouts = ledger.payouts.filter((p) => !accountId || p.accountId === accountId);
  const accountCurrency = new Map(ledger.accounts.map((a) => [a.id, a.currency]));

  const byCurrency = new Map<string, { spent: number; refunds: number; received: number; outstanding: number; pending: number }>();
  const bucket = (currency: string) => {
    let b = byCurrency.get(currency);
    if (!b) {
      b = { spent: 0, refunds: 0, received: 0, outstanding: 0, pending: 0 };
      byCurrency.set(currency, b);
    }
    return b;
  };

  for (const flow of flows) {
    // Shared costs excluded when filtering to one account.
    if (accountId && !flow.accountId) continue;
    const b = bucket(flow.currency);
    if (flow.kind === "expense") b.spent += flow.amount;
    else b.refunds += flow.amount;
  }

  for (const payout of payouts) {
    const currency = accountCurrency.get(payout.accountId);
    if (!currency) continue;
    const b = bucket(currency);
    const net = netReceipts(payout);
    b.received += net;
    if (payout.status === "requested" || payout.status === "approved") {
      const expected = expectedPayoutNet(payout);
      b.outstanding += Math.max(0, expected - net);
      b.pending += 1;
    }
  }

  const out: Record<string, PropCashTotals> = {};
  for (const [currency, b] of byCurrency) {
    const netSpend = b.spent - b.refunds;
    const netCash = b.received + b.refunds - b.spent;
    out[currency] = {
      spent: round2(b.spent),
      refunds: round2(b.refunds),
      netSpend: round2(netSpend),
      received: round2(b.received),
      netCash: round2(netCash),
      cashROI: netSpend > 0 ? round2((netCash / netSpend) * 100) : null,
      outstanding: round2(b.outstanding),
      pending: b.pending,
    };
  }
  return out;
}

/** Resolved pass rate: passed / (passed + breached) across all phases. */
export function propPassRate(accounts: PropAccount[]): number | null {
  const relevant = accounts.filter((a) => a.status === "passed" || a.status === "breached");
  if (relevant.length === 0) return null;
  return relevant.filter((a) => a.status === "passed").length / relevant.length;
}
