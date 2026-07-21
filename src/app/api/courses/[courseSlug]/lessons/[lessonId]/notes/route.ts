import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/lesson-notes/serialize";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import { createLessonNoteSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;

    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (!user) {
      return jsonError("Authentication required", 401);
    }

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const notes = await db.note.findMany({
      where: { lessonId: lesson.id, userId: user.id },
      orderBy: [{ timestampSeconds: "asc" }, { createdAt: "asc" }],
    });

    return jsonOk({ notes: notes.map(serializeNote) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;
    const body = createLessonNoteSchema.parse(await request.json());

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
      name: body.name,
      role: body.role,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const existing = await db.note.findFirst({
      where: { lessonId: lesson.id, userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      const note = await db.note.update({
        where: { id: existing.id },
        data: { content: body.content },
      });

      await db.note.deleteMany({
        where: {
          lessonId: lesson.id,
          userId: user.id,
          id: { not: existing.id },
        },
      });

      return jsonOk({ note: serializeNote(note) });
    }

    const note = await db.note.create({
      data: {
        lessonId: lesson.id,
        userId: user.id,
        content: body.content,
        timestampSeconds: body.timestampSeconds ?? 0,
      },
    });

    return jsonOk({ note: serializeNote(note) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
