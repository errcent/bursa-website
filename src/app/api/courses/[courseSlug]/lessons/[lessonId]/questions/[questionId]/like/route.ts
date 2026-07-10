import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import {
  questionAuthorSelect,
  resolveRequestUser,
  serializeQuestion,
} from "@/lib/lesson-qa/server";
import { lessonQuestionLikeSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string; questionId: string }>;
};

const questionInclude = {
  user: { select: questionAuthorSelect },
  replies: {
    include: { user: { select: questionAuthorSelect } },
    orderBy: { createdAt: "asc" as const },
  },
  likes: { select: { userId: true } },
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, questionId } = await context.params;
    const body = lessonQuestionLikeSchema.parse(await request.json());

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const existing = await db.lessonQuestion.findFirst({
      where: { id: questionId, lessonId: lesson.id },
    });
    if (!existing) {
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

    const alreadyLiked = await db.lessonQuestionLike.findUnique({
      where: {
        questionId_userId: { questionId, userId: user.id },
      },
    });

    if (alreadyLiked) {
      await db.$transaction([
        db.lessonQuestionLike.delete({ where: { id: alreadyLiked.id } }),
        db.lessonQuestion.update({
          where: { id: questionId },
          data: { likeCount: Math.max(0, existing.likeCount - 1) },
        }),
      ]);
    } else {
      await db.$transaction([
        db.lessonQuestionLike.create({
          data: { questionId, userId: user.id },
        }),
        db.lessonQuestion.update({
          where: { id: questionId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
    }

    const question = await db.lessonQuestion.findUniqueOrThrow({
      where: { id: questionId },
      include: questionInclude,
    });

    return jsonOk({ question: serializeQuestion(question, user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
