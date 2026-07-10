import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import {
  canModerateLessonComments,
  questionAuthorSelect,
  resolveRequestUser,
} from "@/lib/lesson-qa/server";
import { updateLessonQuestionReplySchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{
    courseSlug: string;
    lessonId: string;
    questionId: string;
    replyId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, questionId, replyId } = await context.params;
    const body = updateLessonQuestionReplySchema.parse(await request.json());

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const reply = await db.lessonQuestionReply.findFirst({
      where: { id: replyId, questionId },
      include: { question: true },
    });
    if (!reply || reply.question.lessonId !== lesson.id) {
      return jsonError("Reply not found", 404);
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

    const isOwner = reply.userId === user.id;
    const canModerate = await canModerateLessonComments(user.id, lesson.id);
    if (!isOwner && !canModerate) {
      return jsonError("Kamu tidak dapat mengedit balasan ini.", 403);
    }

    const updated = await db.lessonQuestionReply.update({
      where: { id: replyId },
      data: { content: body.content },
      include: { user: { select: questionAuthorSelect } },
    });

    return jsonOk({
      reply: {
        id: updated.id,
        questionId: updated.questionId,
        content: updated.content,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        edited: true,
        user: updated.user,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, questionId, replyId } = await context.params;
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

    const reply = await db.lessonQuestionReply.findFirst({
      where: { id: replyId, questionId },
      include: { question: true },
    });
    if (!reply || reply.question.lessonId !== lesson.id) {
      return jsonError("Reply not found", 404);
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

    const isOwner = reply.userId === user.id;
    const canModerate = await canModerateLessonComments(user.id, lesson.id);
    if (!isOwner && !canModerate) {
      return jsonError("Kamu tidak dapat menghapus balasan ini.", 403);
    }

    await db.lessonQuestionReply.delete({ where: { id: replyId } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
