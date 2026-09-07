import { db } from "@/lib/db";

/**
 * Grant complimentary all-access if the user has no subscription row yet.
 * Pre-monetization: every authenticated learner can watch the full catalog.
 */
export async function ensureComplimentarySubscription(userId: string): Promise<void> {
  await db.subscription.upsert({
    where: { userId },
    create: { userId, status: "COMPLIMENTARY" },
    update: {},
  });
}

export async function hasAllAccess(userId: string): Promise<boolean> {
  await ensureComplimentarySubscription(userId);

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });
  if (!subscription) return false;

  if (subscription.status === "COMPLIMENTARY") return true;
  if (subscription.status === "ACTIVE") {
    return !subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date();
  }
  return false;
}

/** Start a course for progress tracking. Does not create a purchase Transaction. */
export async function startCourseEnrollment(userId: string, courseId: string) {
  return db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, isPaid: false },
    update: {},
  });
}
