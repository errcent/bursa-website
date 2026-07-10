import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import type { ModuleFormInput } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id: courseId } = await context.params;

  try {
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    const input = (await request.json()) as ModuleFormInput;
    if (!input.title?.trim()) {
      return NextResponse.json({ error: "Judul modul wajib diisi." }, { status: 400 });
    }

    const maxOrder = await db.module.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });

    const mod = await db.module.create({
      data: {
        courseId,
        title: input.title.trim(),
        sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: { lessons: true },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_MODULE",
        entityType: "module",
        entityId: mod.id,
        changes: { courseId, title: mod.title } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      {
        id: mod.id,
        title: mod.title,
        sortOrder: mod.sortOrder,
        lessons: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat modul." }, { status: 500 });
  }
}
