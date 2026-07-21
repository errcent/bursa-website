import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { USER_COMMENTS_DISABLED_MESSAGE } from "@/lib/content-features";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    return jsonOk({ questions: [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  return jsonError(USER_COMMENTS_DISABLED_MESSAGE, 403);
}
