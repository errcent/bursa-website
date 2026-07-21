import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { getEnrollmentAccess } from "@/lib/enrollment/access";
import { touchSession } from "@/lib/auth/session-guard";
import { computeProgressPercent, toClientLessonId } from "@/lib/learning/progress";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import { getModuleCompletionSummaries, findCourseBySlug } from "@/lib/reviews/server";
import { upsertLessonProgressSchema } from "@/lib/validations/api";
import { WATCH_COMPLETION_RATIO } from "@/lib/video/playback-heartbeat";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

function buildProgressPayload(
  completedLessonIds: string[],
  totalLessons: number,
  modules: Awaited<ReturnType<typeof getModuleCompletionSummaries>>
) {
  const completedLessons = completedLessonIds.length;
  return {
    completedLessonIds,
    completedLessons,
    totalLessons,
    progressPercent: computeProgressPercent(completedLessons, totalLessons),
    modules,
    completedModules: modules.filter((m) => m.isComplete).length,
    totalModules: modules.length,
  };
}

async function loadCompletedLessonIds(userId: string, courseSlug: string) {
  const course = await findCourseBySlug(courseSlug);
  if (!course) return null;

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressRows = await db.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, completed: true },
    include: { lesson: { select: { legacyId: true, id: true } } },
  });

  const completedLessonIds = progressRows.map((row) => toClientLessonId(row.lesson));
  const modules = await getModuleCompletionSummaries(userId, course);

  return buildProgressPayload(completedLessonIds, lessonIds.length, modules);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;

    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const course = await findCourseBySlug(courseSlug);
    if (!course) {
      return jsonError("Course not found", 404);
    }

    const payload = await loadCompletedLessonIds(user.id, courseSlug);
    if (!payload) {
      return jsonError("Course not found", 404);
    }

    return jsonOk(payload);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const body = upsertLessonProgressSchema.parse(await request.json());

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, body.lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    // Progress is only tracked for enrolled learners — completion is a KPI for review
    // eligibility/ranking, so it must not be writable without enrollment (QC-20260719-16).
    const courseId = lesson.module.course.id;
    const access = await getEnrollmentAccess(user.id, courseId);
    if (!access.enrolled) {
      return jsonError("Kamu belum terdaftar di kelas ini.", 403);
    }

    // Anti-account-sharing: the progress ping doubles as a streaming heartbeat, so we
    // enforce the concurrent-device cap here (QC-20260719-38).
    const session = await touchSession(request, user.id);
    if (!session.allowed) {
      return jsonError(
        "Terlalu banyak perangkat aktif pada akun ini. Tutup sesi lain untuk melanjutkan.",
        429
      );
    }

    // Server-side watch verification (QC-20260719-46): completion is gated on watch time the
    // SERVER accumulated via signed playback heartbeats — NOT the client-reported number, which
    // is only stored as a resume position. A forged `watchedSeconds` can no longer flip completed.
    const durationSeconds = Math.max(0, lesson.durationMinutes * 60);
    const watchThreshold = Math.floor(durationSeconds * WATCH_COMPLETION_RATIO);

    const existingProgress = await db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      select: { verifiedWatchedSeconds: true },
    });
    const verifiedWatchedSeconds = existingProgress?.verifiedWatchedSeconds ?? 0;
    const verifiedCompleted =
      body.completed &&
      (durationSeconds === 0 || verifiedWatchedSeconds >= watchThreshold);

    const progress = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: user.id, lessonId: lesson.id },
      },
      create: {
        userId: user.id,
        lessonId: lesson.id,
        completed: verifiedCompleted,
        watchedSeconds: body.watchedSeconds ?? 0,
      },
      update: {
        completed: verifiedCompleted,
        ...(body.watchedSeconds !== undefined
          ? { watchedSeconds: body.watchedSeconds }
          : {}),
      },
    });

    const payload = await loadCompletedLessonIds(user.id, courseSlug);

    return jsonOk({
      progress: {
        lessonId: body.lessonId,
        completed: progress.completed,
        watchedSeconds: progress.watchedSeconds,
      },
      ...(payload ?? {
        completedLessonIds: [],
        completedLessons: 0,
        totalLessons: 0,
        progressPercent: 0,
        modules: [],
        completedModules: 0,
        totalModules: 0,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
