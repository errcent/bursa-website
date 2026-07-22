import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  instrumentFromUi,
  levelFromUi,
  mapCourse,
  requireAdmin,
  requireAdminPanel,
  slugify,
  unauthorized,
} from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";
import type { CourseFormInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const courses = await db.course.findMany({
      include: {
        mentor: { include: { user: true } },
        modules: { include: { lessons: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(courses.map(mapCourse));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat kelas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const input = (await request.json()) as CourseFormInput;
    const slug = slugify(input.title);

    const course = await db.course.create({
      data: {
        slug,
        title: input.title,
        mentorId: input.mentorId,
        instrument: instrumentFromUi(input.instrument),
        level: levelFromUi(input.level),
        price: input.price,
        durationHours: input.durationHours,
        shortDescription: input.shortDescription,
        thumbnailUrl: input.thumbnailUrl ?? null,
        outcomes: [],
        isPublished: input.isPublished,
        modules: {
          create: input.modules.map((mod, mi) => ({
            title: mod.title,
            sortOrder: mi,
            lessons: {
              create: mod.lessons.map((lesson, li) => ({
                title: lesson.title,
                description: lesson.description ?? null,
                durationMinutes: lesson.durationMinutes,
                isPreviewGratis: lesson.isPreviewGratis ?? false,
                videoUrl: lesson.videoUrl ?? null,
                sortOrder: lesson.sortOrder ?? li,
              })),
            },
          })),
        },
      },
      include: {
        mentor: { include: { user: true } },
        modules: { include: { lessons: true } },
      },
    });

    await db.mentorProfile.update({
      where: { id: input.mentorId },
      data: { coursesCount: { increment: 1 } },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_COURSE",
        entityType: "course",
        entityId: course.id,
      },
    });

    revalidateCatalog();

    return NextResponse.json(mapCourse(course), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat kelas." }, { status: 500 });
  }
}
