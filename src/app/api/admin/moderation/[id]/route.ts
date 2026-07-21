import { ModerationResolution, ModerationStatus } from "@prisma/client";
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

    // "rejected" removes the reported content → the report was correct (reporter UPHELD).
    // "approved" keeps the content → the report was wrong (reporter DISMISSED).
    // This closes the loop so bad-faith reporting carries a reputation cost (QC-20260719-40).
    const resolution =
      decision === "approved"
        ? ModerationResolution.DISMISSED
        : ModerationResolution.UPHELD;

    const item = await db.$transaction(async (tx) => {
      const updated = await tx.contentModerationQueue.update({
        where: { id },
        data: {
          status,
          resolution,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
        include: { reporter: true, reviewer: true },
      });

      if (updated.reportedBy) {
        await tx.user.update({
          where: { id: updated.reportedBy },
          data:
            resolution === ModerationResolution.UPHELD
              ? { moderationReportsUpheld: { increment: 1 } }
              : { moderationReportsDismissed: { increment: 1 } },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: decision === "approved" ? "MODERATION_APPROVE" : "MODERATION_REJECT",
          entityType: "moderation",
          entityId: id,
        },
      });

      return updated;
    });

    return NextResponse.json(await mapModerationItem(item));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memproses moderasi." }, { status: 500 });
  }
}
