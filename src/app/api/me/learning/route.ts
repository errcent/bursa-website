import { NextRequest } from "next/server";

import { computeProgressPercent } from "@/lib/learning/progress";
import { instrumentToUi } from "@/lib/admin/server";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { healHubMembershipsForUserEnrollments } from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";

/**
 * Learner dashboard payload: enrollments + lesson progress for the signed-in user.
 * Query: ?userId=&email=
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId: request.nextUrl.searchParams.get("userId"),
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    // Enrollment without mentor-hub ChatRoomMember → repair on dashboard load.
    await healHubMembershipsForUserEnrollments(user.id);

    const enrollments = await db.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          include: {
            mentor: { select: { slug: true, user: { select: { nama: true } } } },
            modules: {
              orderBy: { sortOrder: "asc" },
              include: {
                lessons: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    id: true,
                    legacyId: true,
                    durationMinutes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const allLessonIds = enrollments.flatMap((e) =>
      e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
    );

    const progressRows =
      allLessonIds.length === 0
        ? []
        : await db.lessonProgress.findMany({
            where: {
              userId: user.id,
              lessonId: { in: allLessonIds },
              completed: true,
            },
            select: { lessonId: true },
          });

    const completedSet = new Set(progressRows.map((p) => p.lessonId));

    const courses = enrollments.map((enrollment) => {
      const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter((l) => completedSet.has(l.id)).length;
      const progressPercent = computeProgressPercent(completedLessons, totalLessons);

      const nextIncomplete = lessons.find((l) => !completedSet.has(l.id));
      const lastLessonId =
        nextIncomplete?.legacyId ??
        lessons[lessons.length - 1]?.legacyId ??
        lessons[0]?.legacyId ??
        "l1";

      const completedMinutes = lessons
        .filter((l) => completedSet.has(l.id))
        .reduce((sum, l) => sum + l.durationMinutes, 0);

      return {
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        instrument: instrumentToUi(enrollment.course.instrument),
        mentorSlug: enrollment.course.mentor.slug,
        mentorName: enrollment.course.mentor.user.nama,
        progressPercent,
        completedLessons,
        totalLessons,
        lastLessonId,
        completedMinutes,
        enrolledAt: enrollment.createdAt.toISOString(),
      };
    });

    const completedCourses = courses.filter(
      (c) => c.totalLessons > 0 && c.completedLessons >= c.totalLessons
    ).length;
    const totalHoursLearned = Math.round(
      courses.reduce((sum, c) => sum + c.completedMinutes, 0) / 60
    );

    return jsonOk({
      courses,
      summary: {
        enrolledCount: courses.length,
        completedCourses,
        totalHoursLearned,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
