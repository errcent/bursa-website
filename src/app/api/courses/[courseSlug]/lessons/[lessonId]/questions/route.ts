import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import {
  questionAuthorSelect,
  resolveRequestUser,
  serializeQuestion,
} from "@/lib/lesson-qa/server";
import { createLessonQuestionSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string }>;
};

const questionInclude = {
  user: { select: questionAuthorSelect },
  replies: {
    include: { user: { select: questionAuthorSelect } },
    orderBy: { createdAt: "asc" as const },
  },
  likes: { select: { userId: true } },
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;
    const viewerEmail = request.nextUrl.searchParams.get("email") ?? undefined;
    const viewerUserId = request.nextUrl.searchParams.get("userId") ?? undefined;

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    let viewerId: string | null = null;
    if (viewerEmail || viewerUserId) {
      const viewer = await resolveRequestUser(
        {
          userId: viewerUserId ?? "anonymous",
          email: viewerEmail,
        },
        { createIfMissing: false }
      );
      viewerId = viewer?.id ?? null;
    }

    const questions = await db.lessonQuestion.findMany({
      where: { lessonId: lesson.id },
      include: questionInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return jsonOk({
      questions: questions.map((q) => serializeQuestion(q, viewerId)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;
    const body = createLessonQuestionSchema.parse(await request.json());

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const user = await resolveRequestUser({
      userId: body.userId,
      email: body.email,
      name: body.name,
      role: body.role,
    });
    if (!user) {
      return jsonError("User not found", 404);
    }

    const question = await db.lessonQuestion.create({
      data: {
        lessonId: lesson.id,
        userId: user.id,
        content: body.content,
        timestampSeconds: body.timestampSeconds,
      },
      include: questionInclude,
    });

    return jsonOk({ question: serializeQuestion(question, user.id) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
