import type { Prisma } from "@prisma/client";

import { PLATFORM_COMMISSION_RATE } from "@/lib/pricing";
import { db } from "@/lib/db";

/** Published payout SLA: net mentor payout is due T+PAYOUT_SLA_DAYS after the period cut-off. */
export const PAYOUT_SLA_DAYS = 14;

export function calculateCommissionAmounts(grossAmount: number) {
  const commissionPct = PLATFORM_COMMISSION_RATE * 100;
  const commissionAmount = Math.round(grossAmount * PLATFORM_COMMISSION_RATE);
  const netMentorAmount = grossAmount - commissionAmount;
  return { commissionPct, commissionAmount, netMentorAmount };
}

export function currentPayoutPeriod(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

/** SLA target date for a payout period (QC-20260719-14): last day of the period + T+X. */
export function payoutDueDate(period: string): Date {
  const [year, month] = period.split("-").map((v) => Number(v));
  // Day 0 of next month == last day of the period month (UTC).
  const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return new Date(periodEnd.getTime() + PAYOUT_SLA_DAYS * 24 * 60 * 60 * 1000);
}

type CommissionInput = {
  transactionId: string;
  mentorId: string;
  grossAmount: number;
};

function commissionData(params: CommissionInput) {
  const { commissionPct, commissionAmount, netMentorAmount } = calculateCommissionAmounts(
    params.grossAmount
  );
  const payoutPeriod = currentPayoutPeriod();
  return {
    transactionId: params.transactionId,
    mentorId: params.mentorId,
    grossAmount: params.grossAmount,
    commissionPct,
    commissionAmount,
    netMentorAmount,
    payoutPeriod,
    payoutDueAt: payoutDueDate(payoutPeriod),
  };
}

/**
 * Create the mentor commission ledger row for a COMPLETED transaction.
 * Single source of truth for the mentor payout split (QC-20260719-13).
 * Pass a `tx` client to run atomically inside an enclosing `$transaction` (QC-20260719-36).
 */
export async function createCommissionRecordForTransaction(
  params: CommissionInput,
  tx: Prisma.TransactionClient = db
) {
  const existing = await tx.commissionRecord.findUnique({
    where: { transactionId: params.transactionId },
    select: { id: true },
  });
  if (existing) return existing;

  return tx.commissionRecord.create({ data: commissionData(params) });
}
