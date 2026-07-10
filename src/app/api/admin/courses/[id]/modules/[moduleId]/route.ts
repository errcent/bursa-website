import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import type { ModuleFormInput } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string; moduleId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId, moduleId } = await context.params;

  try {
    const existing = await db.module.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 });
    }

    const input = (await request.json()) as Partial<ModuleFormInput>;

    const updated = await db.module.update({
      where: { id: moduleId },
      data: {
        title: input.title?.trim() || undefined,
        sortOrder: input.sortOrder,
      },
      include: { lessons: { orderBy: { sortOrder: "asc" } } },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_MODULE",
        entityType: "module",
        entityId: moduleId,
        changes: input as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      sortOrder: updated.sortOrder,
      lessons: updated.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: lesson.durationMinutes,
        isPreviewGratis: lesson.isPreviewGratis,
        videoUrl: lesson.videoUrl,
        sortOrder: lesson.sortOrder,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui modul." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId, moduleId } = await context.params;

  try {
    const existing = await db.module.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 });
    }

    await db.module.delete({ where: { id: moduleId } });

    const remaining = await db.module.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
    });
    await Promise.all(
      remaining.map((mod, index) =>
        db.module.update({ where: { id: mod.id }, data: { sortOrder: index } })
      )
    );

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_MODULE",
        entityType: "module",
        entityId: moduleId,
        changes: { courseId } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus modul." }, { status: 500 });
  }
}
