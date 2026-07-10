import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { mapCourse, requireAdmin, unauthorized } from "@/lib/admin/server";
import type { CurriculumReorderInput } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId } = await context.params;

  try {
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    const input = (await request.json()) as CurriculumReorderInput;
    if (!Array.isArray(input.modules)) {
      return NextResponse.json({ error: "Payload reorder tidak valid." }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      for (const mod of input.modules) {
        const owned = await tx.module.findFirst({
          where: { id: mod.id, courseId },
        });
        if (!owned) continue;

        await tx.module.update({
          where: { id: mod.id },
          data: { sortOrder: mod.sortOrder },
        });

        if (mod.lessons) {
          for (const lesson of mod.lessons) {
            await tx.lesson.updateMany({
              where: { id: lesson.id, moduleId: mod.id },
              data: { sortOrder: lesson.sortOrder },
            });
          }
        }
      }
    });

    const updated = await db.course.findUniqueOrThrow({
      where: { id: courseId },
      include: {
        mentor: { include: { user: true } },
        modules: { include: { lessons: true } },
      },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "REORDER_CURRICULUM",
        entityType: "course",
        entityId: courseId,
        changes: input as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(mapCourse(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengubah urutan kurikulum." }, { status: 500 });
  }
}
