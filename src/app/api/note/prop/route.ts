import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import {
  EMPTY_PROP_LEDGER,
  PROP_LEDGER_BLOB,
  summarizePropLedger,
  type PropAccount,
  type PropCashFlow,
  type PropLedger,
  type PropPayout,
} from "@/lib/note/prop/ledger";
import { getNoteRepo } from "@/lib/note/repo";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

function cuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const currency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);
const money = z.number().finite().min(0).max(1_000_000_000);
const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}/);

async function loadLedger(apexUserId: string): Promise<PropLedger> {
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, PROP_LEDGER_BLOB)) as unknown;
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROP_LEDGER, accounts: [], flows: [], payouts: [] };
  const ledger = raw as Partial<PropLedger>;
  return {
    accounts: Array.isArray(ledger.accounts) ? ledger.accounts : [],
    flows: Array.isArray(ledger.flows) ? ledger.flows : [],
    payouts: Array.isArray(ledger.payouts) ? ledger.payouts : [],
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  try {
    const ledger = await loadLedger(auth.session.userId);
    return applyNoteCors(jsonOk({ ledger, totals: summarizePropLedger(ledger) }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

const accountSchema = z.object({
  firm: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(60),
  currency,
  phase: z.enum(["evaluation", "verification", "funded", "instant", "live"]),
  nominalSize: z.number().finite().min(0).max(100_000_000).nullable().optional(),
  openedAt: isoDate,
  renewalDate: isoDate.nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

const flowSchema = z.object({
  accountId: z.string().trim().max(64).nullable().optional(),
  firm: z.string().trim().min(1).max(60),
  kind: z.enum(["expense", "refund"]),
  category: z.string().trim().min(1).max(32),
  amount: money,
  currency,
  date: isoDate,
  expenseId: z.string().trim().max(64).nullable().optional(),
  reference: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

const payoutSchema = z.object({
  accountId: z.string().trim().min(1).max(64),
  requestedAt: isoDate,
  requestedGross: money,
  traderSharePct: z.number().finite().min(0).max(100),
  expectedFee: money,
  expectedAt: isoDate.nullable().optional(),
});

const receiptSchema = z.object({
  payoutId: z.string().trim().min(1).max(64),
  kind: z.enum(["receipt", "reversal"]),
  amount: money,
  date: isoDate,
  reference: z.string().trim().max(120).nullable().optional(),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("account"), payload: accountSchema }),
  z.object({ action: z.literal("flow"), payload: flowSchema }),
  z.object({ action: z.literal("payout"), payload: payoutSchema }),
  z.object({ action: z.literal("receipt"), payload: receiptSchema }),
  z.object({
    action: z.literal("resolve"),
    payload: z.object({
      accountId: z.string().trim().min(1).max(64),
      status: z.enum(["passed", "breached", "closed", "archived"]),
    }),
  }),
  z.object({
    action: z.literal("payout-status"),
    payload: z.object({
      payoutId: z.string().trim().min(1).max(64),
      status: z.enum(["requested", "approved", "completed", "rejected", "cancelled"]),
    }),
  }),
  z.object({
    action: z.literal("void-flow"),
    payload: z.object({ flowId: z.string().trim().min(1).max(64) }),
  }),
]);

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return applyNoteCors(jsonError("Payload tidak valid.", 400), origin);

    const repo = getNoteRepo();
    const ledger = await loadLedger(auth.session.userId);
    const { action, payload } = parsed.data as { action: string; payload: Record<string, unknown> };

    if (action === "account") {
      const p = payload as unknown as z.infer<typeof accountSchema>;
      const account: PropAccount = {
        id: cuid(), firm: p.firm, name: p.name, currency: p.currency, phase: p.phase,
        status: "active", nominalSize: p.nominalSize ?? null, openedAt: p.openedAt,
        renewalDate: p.renewalDate ?? null, notes: p.notes ?? null,
      };
      ledger.accounts.push(account);
    } else if (action === "flow") {
      const p = payload as unknown as z.infer<typeof flowSchema>;
      if (p.accountId) {
        const account = ledger.accounts.find((a) => a.id === p.accountId);
        if (!account) return applyNoteCors(jsonError("Akun tidak ditemukan.", 404), origin);
        if (account.currency !== p.currency) {
          return applyNoteCors(jsonError("Mata uang harus sama dengan akun.", 400), origin);
        }
      }
      if (p.kind === "refund") {
        if (!p.expenseId) return applyNoteCors(jsonError("Refund wajib menunjuk expense asal.", 400), origin);
        const original = ledger.flows.find((f) => f.id === p.expenseId && f.kind === "expense" && !f.void);
        if (!original) return applyNoteCors(jsonError("Expense asal tidak ditemukan.", 404), origin);
        const refunded = ledger.flows
          .filter((f) => f.kind === "refund" && f.expenseId === p.expenseId && !f.void)
          .reduce((a, f) => a + f.amount, 0);
        if (refunded + p.amount > original.amount + 1e-9) {
          return applyNoteCors(jsonError("Refund melebihi charge asal.", 400), origin);
        }
      }
      const flow: PropCashFlow = {
        id: cuid(), accountId: p.accountId ?? null, firm: p.firm, kind: p.kind,
        category: p.category, amount: p.amount, currency: p.currency, date: p.date,
        expenseId: p.expenseId ?? null, reference: p.reference ?? null, notes: p.notes ?? null, void: false,
      };
      ledger.flows.push(flow);
    } else if (action === "payout") {
      const p = payload as unknown as z.infer<typeof payoutSchema>;
      const account = ledger.accounts.find((a) => a.id === p.accountId);
      if (!account) return applyNoteCors(jsonError("Akun tidak ditemukan.", 404), origin);
      const payout: PropPayout = {
        id: cuid(), accountId: p.accountId, requestedAt: p.requestedAt,
        requestedGross: p.requestedGross, traderSharePct: p.traderSharePct,
        expectedFee: p.expectedFee, expectedAt: p.expectedAt ?? null,
        status: "requested", receipts: [], reversals: [],
      };
      ledger.payouts.push(payout);
    } else if (action === "receipt") {
      const p = payload as unknown as z.infer<typeof receiptSchema>;
      const payout = ledger.payouts.find((x) => x.id === p.payoutId);
      if (!payout) return applyNoteCors(jsonError("Payout tidak ditemukan.", 404), origin);
      if (payout.status === "rejected" || payout.status === "cancelled") {
        return applyNoteCors(jsonError("Payout tertutup tidak bisa menerima dana.", 400), origin);
      }
      const entry = { amount: p.amount, date: p.date, reference: p.reference ?? null };
      if (p.kind === "receipt") payout.receipts.push(entry);
      else payout.reversals.push(entry);
    } else if (action === "resolve") {
      const p = payload as unknown as { accountId: string; status: PropAccount["status"] };
      const account = ledger.accounts.find((a) => a.id === p.accountId);
      if (!account) return applyNoteCors(jsonError("Akun tidak ditemukan.", 404), origin);
      account.status = p.status;
    } else if (action === "payout-status") {
      const p = payload as unknown as { payoutId: string; status: PropPayout["status"] };
      const payout = ledger.payouts.find((x) => x.id === p.payoutId);
      if (!payout) return applyNoteCors(jsonError("Payout tidak ditemukan.", 404), origin);
      payout.status = p.status;
    } else if (action === "void-flow") {
      const p = payload as unknown as { flowId: string };
      const flow = ledger.flows.find((f) => f.id === p.flowId);
      if (!flow) return applyNoteCors(jsonError("Transaksi tidak ditemukan.", 404), origin);
      const hasRefunds = ledger.flows.some((f) => f.kind === "refund" && f.expenseId === p.flowId && !f.void);
      if (hasRefunds) return applyNoteCors(jsonError("Expense dengan refund aktif tidak bisa dibatalkan.", 400), origin);
      flow.void = true;
    } else {
      return applyNoteCors(jsonError("Aksi tidak dikenal.", 400), origin);
    }

    await repo.setUserBlob(auth.session.userId, PROP_LEDGER_BLOB, ledger);
    return applyNoteCors(jsonOk({ ledger, totals: summarizePropLedger(ledger) }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
