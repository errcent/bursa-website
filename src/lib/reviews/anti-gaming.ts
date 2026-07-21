import { db } from "@/lib/db";

export interface ReviewAnomaly {
  flagged: boolean;
  reason: string | null;
}

/**
 * Lightweight reciprocal-ring / mentor-affiliation detection (QC-20260719-34).
 * Flagged reviews are excluded from public aggregates (see stats/server) and queued
 * for moderation. This is intentionally conservative: it flags, it never silently drops.
 */
export async function detectReviewAnomaly(params: {
  reviewerUserId: string;
  courseId: string;
}): Promise<ReviewAnomaly> {
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: { mentor: { select: { id: true, userId: true } } },
  });
  if (!course) return { flagged: false, reason: null };

  const mentorUserId = course.mentor.userId;

  // 1) The mentor (or their own account) reviewing their own course.
  if (params.reviewerUserId === mentorUserId) {
    return { flagged: true, reason: "Reviewer adalah mentor pemilik kelas (self-review)." };
  }

  // 2) Reciprocal ring: reviewer is themselves a mentor whose course the target
  //    mentor has reviewed — a mutual-praise edge in the reputation graph.
  const reviewerMentor = await db.mentorProfile.findUnique({
    where: { userId: params.reviewerUserId },
    select: { id: true },
  });
  if (reviewerMentor) {
    const reciprocal = await db.review.findFirst({
      where: {
        userId: mentorUserId,
        course: { mentorId: reviewerMentor.id },
      },
      select: { id: true },
    });
    if (reciprocal) {
      return {
        flagged: true,
        reason: "Terdeteksi pola ulasan resiprokal antar mentor (rating ring).",
      };
    }
  }

  return { flagged: false, reason: null };
}
