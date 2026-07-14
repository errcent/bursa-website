import { PLATFORM_COMMISSION_RATE } from "@/lib/pricing";
import { db } from "@/lib/db";

export function calculateCommissionAmounts(grossAmount: number) {
  const commissionPct = PLATFORM_COMMISSION_RATE * 100;
  const commissionAmount = Math.round(grossAmount * PLATFORM_COMMISSION_RATE);
  const netMentorAmount = grossAmount - commissionAmount;
  return { commissionPct, commissionAmount, netMentorAmount };
}

export function currentPayoutPeriod(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export async function createCommissionRecordForTransaction(params: {
  transactionId: string;
  mentorId: string;
  grossAmount: number;
}) {
  const existing = await db.commissionRecord.findUnique({
    where: { transactionId: params.transactionId },
    select: { id: true },
  });
  if (existing) return existing;

  const { commissionPct, commissionAmount, netMentorAmount } = calculateCommissionAmounts(
    params.grossAmount
  );

  return db.commissionRecord.create({
    data: {
      transactionId: params.transactionId,
      mentorId: params.mentorId,
      grossAmount: params.grossAmount,
      commissionPct,
      commissionAmount,
      netMentorAmount,
      payoutPeriod: currentPayoutPeriod(),
    },
  });
}
