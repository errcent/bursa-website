import { ModerationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { mapModerationItem, requireAdmin, unauthorized } from "@/lib/admin/server";
import type { ModerationDecision } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const { decision } = (await request.json()) as { decision: ModerationDecision };
    const status =
      decision === "approved"
        ? ModerationStatus.APPROVED
        : ModerationStatus.REJECTED;

    const item = await db.contentModerationQueue.update({
      where: { id },
      data: {
        status,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
      include: { reporter: true, reviewer: true },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: decision === "approved" ? "MODERATION_APPROVE" : "MODERATION_REJECT",
        entityType: "moderation",
        entityId: id,
      },
    });

    return NextResponse.json(await mapModerationItem(item));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memproses moderasi." }, { status: 500 });
  }
}
