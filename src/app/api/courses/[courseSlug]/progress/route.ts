import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { computeProgressPercent, toClientLessonId } from "@/lib/learning/progress";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { getModuleCompletionSummaries, findCourseBySlug } from "@/lib/reviews/server";
import { upsertLessonProgressSchema } from "@/lib/validations/api";

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
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    const email =
      request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      undefined;

    if (!userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      { userId: userId ?? "", email },
      { createIfMissing: false }
    );
    if (!user) {
      return jsonError("User not found", 404);
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

    const user = await resolveRequestUser({
      userId: body.userId,
      email: body.email,
    });
    if (!user) {
      return jsonError("User not found", 404);
    }

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, body.lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const progress = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: user.id, lessonId: lesson.id },
      },
      create: {
        userId: user.id,
        lessonId: lesson.id,
        completed: body.completed,
        watchedSeconds: body.watchedSeconds ?? 0,
      },
      update: {
        completed: body.completed,
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
