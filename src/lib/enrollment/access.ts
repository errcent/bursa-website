import { db } from "@/lib/db";
import { hasAllAccess } from "@/lib/subscription/access";

export interface EnrollmentAccess {
  enrolled: boolean;
  /** True when the learner has all-access (complimentary or paid period). */
  isPaid: boolean;
  /** The COMPLETED paid Transaction id, when one exists. */
  paidTransactionId: string | null;
  hasAllAccess: boolean;
  /** Enrollment row exists — learner has started this course. */
  started: boolean;
}

/**
 * Resolve a learner's access to a course.
 * Full catalog access is gated by all-access subscription, not per-course purchase.
 * `enrolled` remains the write/progress/video gate and is true for all-access users.
 */
export async function getEnrollmentAccess(
  userId: string,
  courseId: string
): Promise<EnrollmentAccess> {
  const [enrollment, paidTx, allAccess] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, isPaid: true },
    }),
    db.transaction.findFirst({
      where: { userId, courseId, status: "COMPLETED", amount: { gt: 0 } },
      select: { id: true },
    }),
    hasAllAccess(userId),
  ]);

  return {
    enrolled: allAccess || Boolean(enrollment),
    isPaid: allAccess,
    paidTransactionId: paidTx?.id ?? null,
    hasAllAccess: allAccess,
    started: Boolean(enrollment),
  };
}

/** True when the course is free (price <= 0). Legacy helper; access is no longer price-gated. */
export async function isFreeCourse(courseId: string): Promise<boolean> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { price: true },
  });
  return (course?.price ?? 0) <= 0;
}
