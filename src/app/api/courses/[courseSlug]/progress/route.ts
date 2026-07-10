import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { getModuleCompletionSummaries, findCourseBySlug } from "@/lib/reviews/server";
import { upsertLessonProgressSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const userId = request.nextUrl.searchParams.get("userId");
    const email = request.nextUrl.searchParams.get("email") ?? undefined;

    if (!userId) {
      return jsonError("userId is required", 400);
    }

    const user = await resolveRequestUser({ userId, email });
    if (!user) {
      return jsonError("User not found", 404);
    }

    const course = await findCourseBySlug(courseSlug);
    if (!course) {
      return jsonError("Course not found", 404);
    }

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const progressRows = await db.lessonProgress.findMany({
      where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
      include: { lesson: { select: { legacyId: true, id: true } } },
    });

    const completedLegacyIds = progressRows
      .map((row) => row.lesson.legacyId)
      .filter((id): id is string => Boolean(id));

    const modules = await getModuleCompletionSummaries(user.id, course);

    return jsonOk({
      completedLessonIds: completedLegacyIds,
      modules,
      completedModules: modules.filter((m) => m.isComplete).length,
      totalModules: modules.length,
    });
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
      },
      update: {
        completed: body.completed,
      },
    });

    const course = await findCourseBySlug(courseSlug);
    const modules = course ? await getModuleCompletionSummaries(user.id, course) : [];

    return jsonOk({
      progress: {
        lessonId: body.lessonId,
        completed: progress.completed,
      },
      modules,
      completedModules: modules.filter((m) => m.isComplete).length,
      totalModules: modules.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
