import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdmin, roleFromUi, roleToUi, unauthorized } from "@/lib/admin/server";
import type { AdminUser } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const { role } = (await request.json()) as { role: AdminUser["role"] };

    const user = await db.user.update({
      where: { id },
      data: { role: roleFromUi(role) },
      include: { _count: { select: { enrollments: true } } },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_USER_ROLE",
        entityType: "user",
        entityId: id,
        changes: { role },
      },
    });

    const mapped: AdminUser = {
      id: user.id,
      name: user.nama,
      email: user.email,
      role: roleToUi(user.role),
      status: "active",
      enrollmentCount: user._count.enrollments,
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui peran pengguna." }, { status: 500 });
  }
}
