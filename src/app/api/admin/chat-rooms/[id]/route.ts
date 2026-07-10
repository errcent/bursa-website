import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { mapChatRoom, requireAdmin, tierFromUi, unauthorized } from "@/lib/admin/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const input = (await request.json()) as Record<string, unknown>;

    const room = await db.chatRoom.update({
      where: { id },
      data: {
        name: input.name as string | undefined,
        description: input.description as string | undefined,
        tier: input.tier ? tierFromUi(input.tier as never) : undefined,
        isProtected: input.isProtected as boolean | undefined,
        screenshotProtection: input.screenshotProtection as boolean | undefined,
        isActive: input.isActive as boolean | undefined,
      },
      include: {
        mentor: { include: { user: true } },
        _count: { select: { members: true } },
      },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_CHAT_ROOM",
        entityType: "chat_room",
        entityId: id,
        changes: input as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(mapChatRoom(room));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui chat room." }, { status: 500 });
  }
}
