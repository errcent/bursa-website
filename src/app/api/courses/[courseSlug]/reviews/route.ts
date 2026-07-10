import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { getReviewEligibility, serializeCourseReview } from "@/lib/reviews/server";
import { recalculateStatsForCourse } from "@/lib/stats/server";
import { createCourseReviewSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

const authorSelect = { id: true, nama: true } as const;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    const email = request.nextUrl.searchParams.get("email") ?? undefined;

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) {
      return jsonError("Course not found", 404);
    }

    const reviews = await db.review.findMany({
      where: { courseId: course.id },
      include: { user: { select: authorSelect } },
      orderBy: { createdAt: "desc" },
    });

    let eligibility = null;
    if (userId) {
      const user = await resolveRequestUser({ userId, email });
      if (user) {
        const result = await getReviewEligibility(user.id, courseSlug);
        eligibility = result?.eligibility ?? null;
      }
    }

    return jsonOk({
      reviews: reviews.map(serializeCourseReview),
      eligibility,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const body = createCourseReviewSchema.parse(await request.json());

    const user = await resolveRequestUser({
      userId: body.userId,
      email: body.email,
    });
    if (!user) {
      return jsonError("User not found", 404);
    }

    const result = await getReviewEligibility(user.id, courseSlug);
    if (!result) {
      return jsonError("Course not found", 404);
    }

    if (!result.eligibility.canReview) {
      return jsonError(
        result.eligibility.reason ?? "Belum memenuhi syarat untuk mengirim ulasan.",
        403
      );
    }

    if (!body.acceptedRules) {
      return jsonError("Kamu harus menyetujui aturan rating & ulasan.", 422);
    }

    const review = await db.review.create({
      data: {
        userId: user.id,
        courseId: result.courseId,
        rating: body.rating,
        comment: body.comment,
      },
      include: { user: { select: authorSelect } },
    });

    await recalculateStatsForCourse(result.courseId);

    return jsonOk({ review: serializeCourseReview(review) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
