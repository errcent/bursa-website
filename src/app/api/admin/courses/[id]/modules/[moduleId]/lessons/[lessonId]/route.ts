import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import type { LessonFormInput } from "@/lib/admin/types";

type RouteContext = {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
};

function mapLesson(lesson: {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  isPreviewGratis: boolean;
  videoUrl: string | null;
  sortOrder: number;
}) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    durationMinutes: lesson.durationMinutes,
    isPreviewGratis: lesson.isPreviewGratis,
    videoUrl: lesson.videoUrl,
    sortOrder: lesson.sortOrder,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId, moduleId, lessonId } = await context.params;

  try {
    const existing = await db.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId,
        module: { courseId },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Lesson tidak ditemukan." }, { status: 404 });
    }

    const input = (await request.json()) as Partial<LessonFormInput>;

    if (input.moduleId && input.moduleId !== moduleId) {
      const targetModule = await db.module.findFirst({
        where: { id: input.moduleId, courseId },
      });
      if (!targetModule) {
        return NextResponse.json({ error: "Modul tujuan tidak ditemukan." }, { status: 404 });
      }
    }

    const updated = await db.lesson.update({
      where: { id: lessonId },
      data: {
        title: input.title?.trim() || undefined,
        description:
          input.description === undefined
            ? undefined
            : input.description?.trim() || null,
        durationMinutes: input.durationMinutes,
        isPreviewGratis: input.isPreviewGratis,
        videoUrl:
          input.videoUrl === undefined ? undefined : input.videoUrl?.trim() || null,
        sortOrder: input.sortOrder,
        moduleId: input.moduleId,
      },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_LESSON",
        entityType: "lesson",
        entityId: lessonId,
        changes: input as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(mapLesson(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui lesson." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId, moduleId, lessonId } = await context.params;

  try {
    const existing = await db.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId,
        module: { courseId },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Lesson tidak ditemukan." }, { status: 404 });
    }

    await db.lesson.delete({ where: { id: lessonId } });

    const remaining = await db.lesson.findMany({
      where: { moduleId },
      orderBy: { sortOrder: "asc" },
    });
    await Promise.all(
      remaining.map((lesson, index) =>
        db.lesson.update({ where: { id: lesson.id }, data: { sortOrder: index } })
      )
    );

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_LESSON",
        entityType: "lesson",
        entityId: lessonId,
        changes: { courseId, moduleId } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus lesson." }, { status: 500 });
  }
}
