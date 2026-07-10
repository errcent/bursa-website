import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import {
  canModerateLessonComments,
  questionAuthorSelect,
  resolveRequestUser,
  serializeQuestion,
} from "@/lib/lesson-qa/server";
import { updateLessonQuestionSchema } from "@/lib/validations/api";

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, questionId } = await context.params;
    const body = updateLessonQuestionSchema.parse(await request.json());

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

    const isOwner = existing.userId === user.id;
    const canModerate = await canModerateLessonComments(user.id, lesson.id);

    if (body.content !== undefined) {
      if (!isOwner && !canModerate) {
        return jsonError("Kamu tidak dapat mengedit komentar ini.", 403);
      }
    }

    if (body.isPinned !== undefined && !canModerate) {
      return jsonError("Hanya mentor kelas yang dapat menyematkan komentar.", 403);
    }

    if (body.content === undefined && body.isPinned === undefined) {
      return jsonError("Tidak ada perubahan.", 400);
    }

    const question = await db.lessonQuestion.update({
      where: { id: questionId },
      data: {
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
      },
      include: questionInclude,
    });

    return jsonOk({ question: serializeQuestion(question, user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, questionId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      email?: string;
      name?: string;
      role?: string;
    };

    if (!body.userId) {
      return jsonError("userId required", 400);
    }

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

    const isOwner = existing.userId === user.id;
    const canModerate = await canModerateLessonComments(user.id, lesson.id);
    if (!isOwner && !canModerate) {
      return jsonError("Kamu tidak dapat menghapus komentar ini.", 403);
    }

    await db.lessonQuestion.delete({ where: { id: questionId } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
