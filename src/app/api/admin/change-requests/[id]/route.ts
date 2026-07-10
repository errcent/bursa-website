import { ChangeRequestAction, ChangeRequestStatus, type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";
import {
  applyChangeRequest,
  captureSnapshot,
  changeRequestInclude,
  mapChangeRequest,
} from "@/lib/mentor/change-requests";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const item = await db.courseChangeRequest.findUnique({
      where: { id },
      include: changeRequestInclude,
    });

    if (!item) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(mapChangeRequest(item));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat pengajuan." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const input = (await request.json()) as {
      decision?: "approve" | "reject" | "approved" | "rejected" | "edited";
      adminNote?: string;
      editedData?: Record<string, unknown> | null;
    };

    const raw = input.decision;
    const decision =
      raw === "approve" || raw === "approved" || raw === "edited"
        ? raw === "edited"
          ? "edited"
          : "approve"
        : raw === "reject" || raw === "rejected"
          ? "reject"
          : null;

    if (!decision) {
      return NextResponse.json({ error: "Keputusan tidak valid." }, { status: 400 });
    }

    const existing = await db.courseChangeRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
    }

    if (existing.status !== ChangeRequestStatus.PENDING) {
      return NextResponse.json({ error: "Pengajuan ini sudah diproses." }, { status: 409 });
    }

    if (decision === "reject") {
      const item = await db.courseChangeRequest.update({
        where: { id },
        data: {
          status: ChangeRequestStatus.REJECTED,
          adminNote: input.adminNote?.trim() || null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        include: changeRequestInclude,
      });

      await db.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "CHANGE_REQUEST_REJECT",
          entityType: "course_change_request",
          entityId: id,
          changes: { adminNote: input.adminNote ?? null },
        },
      });

      return NextResponse.json(mapChangeRequest(item));
    }

    const withEdit = Boolean(input.editedData) || raw === "edited";
    const payloadToApply = withEdit
      ? (input.editedData ?? (existing.proposedData as Record<string, unknown> | null))
      : (existing.proposedData as Record<string, unknown> | null);

    // Re-verify target still exists before mutating live curriculum.
    if (existing.action !== ChangeRequestAction.CREATE) {
      const live = await captureSnapshot({
        targetType: existing.targetType,
        courseId: existing.courseId,
        moduleId: existing.moduleId,
        lessonId: existing.lessonId,
      });
      if (live === null) {
        return NextResponse.json(
          {
            error:
              "Target usulan sudah tidak ada di kurikulum (mungkin dihapus/diubah admin lain). Tolak atau minta mentor mengajukan ulang.",
          },
          { status: 409 }
        );
      }
    }

    const applied = await applyChangeRequest(existing, payloadToApply);

    const item = await db.courseChangeRequest.update({
      where: { id },
      data: {
        status: withEdit ? ChangeRequestStatus.EDITED : ChangeRequestStatus.APPROVED,
        appliedData: (applied ?? undefined) as Prisma.InputJsonValue | undefined,
        adminNote: input.adminNote?.trim() || null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
      include: changeRequestInclude,
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: withEdit ? "CHANGE_REQUEST_EDIT_APPROVE" : "CHANGE_REQUEST_APPROVE",
        entityType: "course_change_request",
        entityId: id,
        changes: {
          appliedData: applied,
          adminNote: input.adminNote ?? null,
        },
      },
    });

    return NextResponse.json(mapChangeRequest(item));
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Gagal memproses pengajuan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
