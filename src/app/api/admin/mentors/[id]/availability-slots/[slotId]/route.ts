import { NextResponse } from "next/server";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";
import { mapAvailabilitySlot, parseSlotDateTime } from "@/lib/sessions/server";
import type { SlotFormInput } from "@/lib/sessions/types";

type RouteContext = { params: Promise<{ id: string; slotId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id, slotId } = await context.params;

  try {
    const existing = await db.mentorAvailabilitySlot.findFirst({
      where: { id: slotId, mentorId: id },
    });
    if (!existing) return jsonError("Slot tidak ditemukan.", 404);
    if (existing.isBooked) {
      return jsonError("Slot yang sudah dibooking tidak dapat diubah.", 409);
    }

    const input = (await request.json()) as Partial<SlotFormInput>;
    const date = input.date ?? existing.startAt.toISOString().slice(0, 10);
    const startTime =
      input.startTime ??
      existing.startAt.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    const endTime =
      input.endTime ??
      existing.endAt.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });

    const startAt = parseSlotDateTime(date, startTime);
    const endAt = parseSlotDateTime(date, endTime);

    if (endAt <= startAt) {
      return jsonError("Waktu selesai harus setelah waktu mulai.", 422);
    }

    const slot = await db.mentorAvailabilitySlot.update({
      where: { id: slotId },
      data: {
        startAt,
        endAt,
        notes: input.notes !== undefined ? input.notes?.trim() || null : undefined,
      },
      include: { bookedBy: { select: { id: true, nama: true } } },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_SESSION_SLOT",
        entityType: "mentor_availability_slot",
        entityId: slotId,
        changes: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
      },
    });

    return NextResponse.json(mapAvailabilitySlot(slot));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id, slotId } = await context.params;

  try {
    const existing = await db.mentorAvailabilitySlot.findFirst({
      where: { id: slotId, mentorId: id },
    });
    if (!existing) return jsonError("Slot tidak ditemukan.", 404);
    if (existing.isBooked) {
      return jsonError("Slot yang sudah dibooking tidak dapat dihapus.", 409);
    }

    await db.mentorAvailabilitySlot.delete({ where: { id: slotId } });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_SESSION_SLOT",
        entityType: "mentor_availability_slot",
        entityId: slotId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
