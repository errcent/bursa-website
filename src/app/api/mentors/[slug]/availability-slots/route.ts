import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { mapAvailabilitySlot } from "@/lib/sessions/server";

type RouteContext = { params: Promise<{ slug: string }> };

/** List open (unbooked, future) availability slots for a mentor. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const mentor = await db.mentorProfile.findUnique({
      where: { slug },
      include: { user: { select: { nama: true } } },
    });

    if (!mentor) return jsonError("Mentor tidak ditemukan.", 404);
    if (!mentor.availableFor1on1) {
      return jsonOk({
        mentor: {
          slug: mentor.slug,
          name: mentor.user.nama,
          availableFor1on1: false,
          sessionPrice: mentor.sessionPrice,
        },
        slots: [],
      });
    }

    const now = new Date();
    const slots = await db.mentorAvailabilitySlot.findMany({
      where: {
        mentorId: mentor.id,
        isBooked: false,
        startAt: { gt: now },
      },
      include: { bookedBy: { select: { id: true, nama: true } } },
      orderBy: { startAt: "asc" },
    });

    return jsonOk({
      mentor: {
        slug: mentor.slug,
        name: mentor.user.nama,
        availableFor1on1: mentor.availableFor1on1,
        sessionPrice: mentor.sessionPrice,
      },
      slots: slots.map(mapAvailabilitySlot),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
