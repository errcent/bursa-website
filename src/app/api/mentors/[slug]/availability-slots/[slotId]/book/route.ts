import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { mapAvailabilitySlot } from "@/lib/sessions/server";
import type { SessionBookingResult } from "@/lib/sessions/types";

type RouteContext = { params: Promise<{ slug: string; slotId: string }> };

/** Book an availability slot (prototype: marks isBooked, no payment). */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug, slotId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      role?: string;
      userId?: string;
    };

    const email =
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      body.email?.trim().toLowerCase() ||
      undefined;

    if (!email) return jsonError("Masuk terlebih dahulu untuk membooking sesi.", 401);

    const user = await resolveRequestUser(
      {
        userId: body.userId?.trim() || "",
        email,
        name: body.name,
        role: body.role,
      },
      { createIfMissing: true }
    );
    if (!user) return jsonError("Pengguna tidak ditemukan.", 404);

    const mentor = await db.mentorProfile.findUnique({
      where: { slug },
      include: { user: { select: { nama: true } } },
    });
    if (!mentor) return jsonError("Mentor tidak ditemukan.", 404);
    if (!mentor.availableFor1on1) {
      return jsonError("Mentor ini belum membuka sesi 1-on-1.", 403);
    }

    const slot = await db.mentorAvailabilitySlot.findFirst({
      where: { id: slotId, mentorId: mentor.id },
      include: { bookedBy: { select: { id: true, nama: true } } },
    });
    if (!slot) return jsonError("Slot tidak ditemukan.", 404);
    if (slot.isBooked) return jsonError("Slot ini sudah dibooking.", 409);
    if (slot.startAt <= new Date()) {
      return jsonError("Slot sudah lewat dan tidak dapat dibooking.", 410);
    }

    const booked = await db.mentorAvailabilitySlot.update({
      where: { id: slotId },
      data: {
        isBooked: true,
        bookedByUserId: user.id,
      },
      include: { bookedBy: { select: { id: true, nama: true } } },
    });

    const result: SessionBookingResult = {
      slot: mapAvailabilitySlot(booked),
      mentorName: mentor.user.nama,
      mentorSlug: mentor.slug,
    };

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
