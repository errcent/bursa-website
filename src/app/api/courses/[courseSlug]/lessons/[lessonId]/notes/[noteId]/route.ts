import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/lesson-notes/serialize";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { updateLessonNoteSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string; noteId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, noteId } = await context.params;
    const body = updateLessonNoteSchema.parse(await request.json());

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const existing = await db.note.findFirst({
      where: { id: noteId, lessonId: lesson.id },
    });
    if (!existing) {
      return jsonError("Note not found", 404);
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

    if (existing.userId !== user.id) {
      return jsonError("Kamu tidak dapat mengedit catatan ini.", 403);
    }

    if (body.content === undefined && body.timestampSeconds === undefined) {
      return jsonError("Tidak ada perubahan.", 400);
    }

    const note = await db.note.update({
      where: { id: noteId },
      data: {
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.timestampSeconds !== undefined
          ? { timestampSeconds: body.timestampSeconds }
          : {}),
      },
    });

    return jsonOk({ note: serializeNote(note) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId, noteId } = await context.params;
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

    const existing = await db.note.findFirst({
      where: { id: noteId, lessonId: lesson.id },
    });
    if (!existing) {
      return jsonError("Note not found", 404);
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

    if (existing.userId !== user.id) {
      return jsonError("Kamu tidak dapat menghapus catatan ini.", 403);
    }

    await db.note.delete({ where: { id: noteId } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
