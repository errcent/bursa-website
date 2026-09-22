import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  expectedPayoutNet,
  propPassRate,
  summarizePropLedger,
  type PropLedger,
} from "../src/lib/note/prop/ledger";

const ledger: PropLedger = {
  accounts: [
    { id: "a1", firm: "FTMO", name: "Eval 1", currency: "USD", phase: "evaluation", status: "breached", nominalSize: 100000, openedAt: "2026-01-01", renewalDate: null, notes: null },
    { id: "a2", firm: "FTMO", name: "Eval 2", currency: "USD", phase: "funded", status: "passed", nominalSize: 100000, openedAt: "2026-02-01", renewalDate: null, notes: null },
  ],
  flows: [
    { id: "e1", accountId: "a1", firm: "FTMO", kind: "expense", category: "evaluation", amount: 150, currency: "USD", date: "2026-01-01", expenseId: null, reference: null, notes: null, void: false },
    { id: "e2", accountId: "a2", firm: "FTMO", kind: "expense", category: "evaluation", amount: 150, currency: "USD", date: "2026-02-01", expenseId: null, reference: null, notes: null, void: false },
    { id: "r1", accountId: "a2", firm: "FTMO", kind: "refund", category: "evaluation", amount: 50, currency: "USD", date: "2026-03-01", expenseId: "e2", reference: null, notes: null, void: false },
  ],
  payouts: [
    {
      id: "p1", accountId: "a2", requestedAt: "2026-04-01", requestedGross: 1000,
      traderSharePct: 90, expectedFee: 10, expectedAt: null, status: "completed",
      receipts: [{ amount: 400, date: "2026-04-05", reference: null }, { amount: 490, date: "2026-04-06", reference: null }],
      reversals: [],
    },
  ],
};

describe("prop ledger", () => {
  it("computes expected payout net from share and fee", () => {
    assert.equal(expectedPayoutNet(ledger.payouts[0]!), 890);
  });

  it("summarizes cash per currency without FX conversion", () => {
    const totals = summarizePropLedger(ledger);
    const usd = totals["USD"]!;
    assert.equal(usd.spent, 300);
    assert.equal(usd.refunds, 50);
    assert.equal(usd.netSpend, 250);
    assert.equal(usd.received, 890);
    assert.equal(usd.netCash, 640);
    assert.equal(usd.cashROI, 256);
    assert.equal(usd.outstanding, 0);
  });

  it("tracks outstanding on open payouts only", () => {
    const open = {
      ...ledger,
      payouts: [{ ...ledger.payouts[0]!, status: "approved" as const }],
    };
    const usd = summarizePropLedger(open)["USD"]!;
    // expected 890, received 890 → outstanding 0 even when open
    assert.equal(usd.outstanding, 0);
    const partial = {
      ...ledger,
      payouts: [{ ...ledger.payouts[0]!, status: "approved" as const, receipts: [{ amount: 400, date: "2026-04-05", reference: null }] }],
    };
    assert.equal(summarizePropLedger(partial)["USD"]!.outstanding, 490);
  });

  it("computes resolved phase pass rate", () => {
    assert.equal(propPassRate(ledger.accounts), 0.5);
    assert.equal(propPassRate([]), null);
  });
});
