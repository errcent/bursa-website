import { db } from "@/lib/db";

/** Default forced-resolution horizon when a mentor does not set one (days). */
export const DEFAULT_SIGNAL_HORIZON_DAYS = 30;

export function defaultSignalExpiry(from = new Date()): Date {
  return new Date(from.getTime() + DEFAULT_SIGNAL_HORIZON_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Auto-resolve ACTIVE signals past their expiry so a track record cannot be
 * cherry-picked by leaving losing calls perpetually "open" (QC-20260719-19).
 *
 * Note: HIT_TARGET / HIT_STOP classification and realized P/L require a market
 * price feed (out of scope until the market-data toolkit, QC-20260717-01, lands).
 * Until then expiry forces closure to EXPIRED with an immutable, mentor-non-deletable
 * record; the platform computes any displayed hit-rate from these outcomes only.
 */
export async function resolveExpiredSignals(where?: { roomId?: string; mentorId?: string }) {
  const now = new Date();
  await db.tradingSignal.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { not: null, lte: now },
      ...(where?.roomId ? { roomId: where.roomId } : {}),
      ...(where?.mentorId ? { mentorId: where.mentorId } : {}),
    },
    data: {
      status: "CLOSED",
      outcome: "EXPIRED",
      resolvedAt: now,
      closedAt: now,
    },
  });
}

/** Platform-computed outcome tally for a mentor — derived only, never mentor-set (QC-20260719-19/20). */
export async function getMentorSignalOutcomes(mentorId: string) {
  const grouped = await db.tradingSignal.groupBy({
    by: ["outcome"],
    where: { mentorId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(grouped.map((g) => [g.outcome, g._count._all]));
  const resolved =
    (counts.HIT_TARGET ?? 0) + (counts.HIT_STOP ?? 0) + (counts.EXPIRED ?? 0) + (counts.MANUAL_CLOSE ?? 0);
  const wins = counts.HIT_TARGET ?? 0;
  return {
    counts,
    resolved,
    wins,
    hitRate: resolved > 0 ? Number((wins / resolved).toFixed(3)) : null,
  };
}
