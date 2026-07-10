import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  instrumentFromUi,
  levelFromUi,
  mapCourse,
  requireAdmin,
  unauthorized,
} from "@/lib/admin/server";
import type { CourseFormInput } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const course = await db.course.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: true } },
        modules: {
          include: { lessons: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(mapCourse(course));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat kelas." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const input = (await request.json()) as Partial<CourseFormInput>;

    await db.course.update({
      where: { id },
      data: {
        title: input.title,
        shortDescription: input.shortDescription,
        price: input.price,
        level: input.level ? levelFromUi(input.level) : undefined,
        instrument: input.instrument ? instrumentFromUi(input.instrument) : undefined,
        mentorId: input.mentorId,
        durationHours: input.durationHours,
        isPublished: input.isPublished,
      },
    });

    if (input.modules) {
      const existingModules = await db.module.findMany({
        where: { courseId: id },
        include: { lessons: true },
      });
      const keepModuleIds = new Set(
        input.modules.map((m) => m.id).filter((mid): mid is string => Boolean(mid))
      );

      for (const existing of existingModules) {
        if (!keepModuleIds.has(existing.id)) {
          await db.module.delete({ where: { id: existing.id } });
        }
      }

      for (const [mi, mod] of input.modules.entries()) {
        let moduleId = mod.id;
        if (moduleId && existingModules.some((m) => m.id === moduleId)) {
          await db.module.update({
            where: { id: moduleId },
            data: { title: mod.title, sortOrder: mi },
          });
        } else {
          const created = await db.module.create({
            data: {
              courseId: id,
              title: mod.title,
              sortOrder: mi,
            },
          });
          moduleId = created.id;
        }

        const existingLessons = existingModules.find((m) => m.id === mod.id)?.lessons ?? [];
        const keepLessonIds = new Set(
          mod.lessons.map((l) => l.id).filter((lid): lid is string => Boolean(lid))
        );

        for (const existingLesson of existingLessons) {
          if (!keepLessonIds.has(existingLesson.id)) {
            await db.lesson.delete({ where: { id: existingLesson.id } });
          }
        }

        for (const [li, lesson] of mod.lessons.entries()) {
          if (lesson.id && existingLessons.some((l) => l.id === lesson.id)) {
            await db.lesson.update({
              where: { id: lesson.id },
              data: {
                moduleId,
                title: lesson.title,
                description:
                  lesson.description === undefined ? undefined : lesson.description ?? null,
                durationMinutes: lesson.durationMinutes,
                isPreviewGratis: lesson.isPreviewGratis ?? false,
                videoUrl: lesson.videoUrl === undefined ? undefined : lesson.videoUrl ?? null,
                sortOrder: lesson.sortOrder ?? li,
              },
            });
          } else {
            await db.lesson.create({
              data: {
                moduleId: moduleId!,
                title: lesson.title,
                description: lesson.description ?? null,
                durationMinutes: lesson.durationMinutes,
                isPreviewGratis: lesson.isPreviewGratis ?? false,
                videoUrl: lesson.videoUrl ?? null,
                sortOrder: lesson.sortOrder ?? li,
              },
            });
          }
        }
      }
    }

    const course = await db.course.findUniqueOrThrow({
      where: { id },
      include: {
        mentor: { include: { user: true } },
        modules: { include: { lessons: true } },
      },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_COURSE",
        entityType: "course",
        entityId: id,
        changes: input as Prisma.InputJsonValue,
      },
    });

    revalidateCatalog();

    return NextResponse.json(mapCourse(course));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui kelas." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    await db.course.delete({ where: { id } });
    await db.mentorProfile.update({
      where: { id: course.mentorId },
      data: { coursesCount: { decrement: 1 } },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_COURSE",
        entityType: "course",
        entityId: id,
      },
    });

    revalidateCatalog();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus kelas." }, { status: 500 });
  }
}
