import { NextResponse } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";
import { mapAvailabilitySlot, parseSlotDateTime } from "@/lib/sessions/server";
import type { SlotFormInput } from "@/lib/sessions/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const mentor = await db.mentorProfile.findUnique({ where: { id } });
    if (!mentor) return jsonError("Mentor tidak ditemukan.", 404);

    const slots = await db.mentorAvailabilitySlot.findMany({
      where: { mentorId: id },
      include: { bookedBy: { select: { id: true, nama: true } } },
      orderBy: { startAt: "asc" },
    });

    return jsonOk({
      mentor: {
        id: mentor.id,
        slug: mentor.slug,
        availableFor1on1: mentor.availableFor1on1,
        sessionPrice: mentor.sessionPrice,
      },
      slots: slots.map(mapAvailabilitySlot),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const input = (await request.json()) as SlotFormInput;
    if (!input.date || !input.startTime || !input.endTime) {
      return jsonError("Tanggal dan rentang waktu wajib diisi.", 422);
    }

    const mentor = await db.mentorProfile.findUnique({ where: { id } });
    if (!mentor) return jsonError("Mentor tidak ditemukan.", 404);

    const startAt = parseSlotDateTime(input.date, input.startTime);
    const endAt = parseSlotDateTime(input.date, input.endTime);

    if (endAt <= startAt) {
      return jsonError("Waktu selesai harus setelah waktu mulai.", 422);
    }

    const slot = await db.mentorAvailabilitySlot.create({
      data: {
        mentorId: id,
        startAt,
        endAt,
        notes: input.notes?.trim() || null,
        createdByAdminId: admin.id,
      },
      include: { bookedBy: { select: { id: true, nama: true } } },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_SESSION_SLOT",
        entityType: "mentor_availability_slot",
        entityId: slot.id,
        changes: { mentorId: id, startAt: startAt.toISOString(), endAt: endAt.toISOString() },
      },
    });

    return NextResponse.json(mapAvailabilitySlot(slot), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
