import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdminPanel, roleToUi, unauthorized } from "@/lib/admin/server";
import type { AdminUser } from "@/lib/admin/types";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const users = await db.user.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
    });

    const mapped: AdminUser[] = users.map((u) => ({
      id: u.id,
      name: u.nama,
      email: u.email,
      role: roleToUi(u.role),
      status: "active",
      enrollmentCount: u._count.enrollments,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat pengguna." }, { status: 500 });
  }
}
