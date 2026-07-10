import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import {
  questionAuthorSelect,
  resolveRequestUser,
} from "@/lib/lesson-qa/server";
import { createLessonQuestionReplySchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string; questionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, questionId } = await context.params;
    const body = createLessonQuestionReplySchema.parse(await request.json());

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const question = await db.lessonQuestion.findFirst({
      where: { id: questionId, lessonId: lesson.id },
    });
    if (!question) {
      return jsonError("Comment not found", 404);
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

    const reply = await db.lessonQuestionReply.create({
      data: {
        questionId,
        userId: user.id,
        content: body.content,
      },
      include: {
        user: { select: questionAuthorSelect },
      },
    });

    return jsonOk(
      {
        reply: {
          id: reply.id,
          questionId: reply.questionId,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          edited: false,
          user: reply.user,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
