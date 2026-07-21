import { db } from "@/lib/db";

export interface EnrollmentAccess {
  enrolled: boolean;
  /** Backed by a COMPLETED paid Transaction (verified purchase). */
  isPaid: boolean;
  /** The COMPLETED paid Transaction id, when one exists. */
  paidTransactionId: string | null;
}

/**
 * Resolve a learner's access to a course. `enrolled` gates write actions on paid
 * content (progress, Q&A, notes, likes — QC-20260719-16/28/29); `isPaid` gates the
 * verified-purchase review/eligibility path and ranking metrics (QC-20260719-15/26/27).
 */
export async function getEnrollmentAccess(
  userId: string,
  courseId: string
): Promise<EnrollmentAccess> {
  const [enrollment, paidTx] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, isPaid: true },
    }),
    db.transaction.findFirst({
      where: { userId, courseId, status: "COMPLETED", amount: { gt: 0 } },
      select: { id: true },
    }),
  ]);

  const isPaid = Boolean(paidTx) || Boolean(enrollment?.isPaid);
  return {
    enrolled: Boolean(enrollment),
    isPaid,
    paidTransactionId: paidTx?.id ?? null,
  };
}

/** True when the course is free (price <= 0) — free courses do not require a paid tx. */
export async function isFreeCourse(courseId: string): Promise<boolean> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { price: true },
  });
  return (course?.price ?? 0) <= 0;
}
