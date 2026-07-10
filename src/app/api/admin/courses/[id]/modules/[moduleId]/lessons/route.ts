import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import type { LessonFormInput } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string; moduleId: string }> };

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

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId, moduleId } = await context.params;

  try {
    const mod = await db.module.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!mod) {
      return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 });
    }

    const input = (await request.json()) as LessonFormInput;
    if (!input.title?.trim()) {
      return NextResponse.json({ error: "Judul lesson wajib diisi." }, { status: 400 });
    }
    if (!input.durationMinutes || input.durationMinutes < 1) {
      return NextResponse.json({ error: "Durasi lesson minimal 1 menit." }, { status: 400 });
    }

    const maxOrder = await db.lesson.aggregate({
      where: { moduleId },
      _max: { sortOrder: true },
    });

    const lesson = await db.lesson.create({
      data: {
        moduleId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        durationMinutes: input.durationMinutes,
        isPreviewGratis: input.isPreviewGratis ?? false,
        videoUrl: input.videoUrl?.trim() || null,
        sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_LESSON",
        entityType: "lesson",
        entityId: lesson.id,
        changes: { courseId, moduleId, title: lesson.title } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(mapLesson(lesson), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat lesson." }, { status: 500 });
  }
}
