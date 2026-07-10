import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/lesson-notes/serialize";
import { findLessonByCourseAndLegacyId } from "@/lib/lesson-qa/resolve-lesson";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { createLessonNoteSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;
    const viewerEmail = request.nextUrl.searchParams.get("email") ?? undefined;
    const viewerUserId = request.nextUrl.searchParams.get("userId") ?? undefined;

    if (!viewerEmail && !viewerUserId) {
      return jsonError("Authentication required", 401);
    }

    const lesson = await findLessonByCourseAndLegacyId(courseSlug, lessonId);
    if (!lesson) {
      return jsonError("Lesson not found", 404);
    }

    const user = await resolveRequestUser(
      {
        userId: viewerUserId ?? "anonymous",
        email: viewerEmail,
      },
      { createIfMissing: false }
    );
    if (!user) {
      return jsonOk({ notes: [] });
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

    const user = await resolveRequestUser({
      userId: body.userId,
      email: body.email,
      name: body.name,
      role: body.role,
    });
    if (!user) {
      return jsonError("User not found", 404);
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
