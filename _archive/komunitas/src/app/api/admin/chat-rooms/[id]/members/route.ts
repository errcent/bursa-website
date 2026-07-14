import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdmin, unauthorized } from "@/lib/admin/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const members = await db.chatRoomMember.findMany({
      where: { roomId: id },
      include: { user: true },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.nama,
        email: m.user.email,
        role: m.role.toLowerCase(),
        joinedAt: m.joinedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat anggota." }, { status: 500 });
  }
}
