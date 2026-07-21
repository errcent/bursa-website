import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { createCommissionRecordForTransaction } from "@/lib/mentor/commission";
import { mapAvailabilitySlot } from "@/lib/sessions/server";
import type { SessionBookingResult } from "@/lib/sessions/types";

type RouteContext = { params: Promise<{ slug: string; slotId: string }> };

/** Max concurrent upcoming bookings a single learner may hold (QC-20260719-21). */
const ACTIVE_BOOKING_CAP = 3;

/** Free-cancel window (hours before start). Inside this window the slot is FORFEITED. */
const CANCEL_WINDOW_HOURS = 12;

/**
 * Book an availability slot. The mentor's typed session price is captured as a one-time,
 * non-refundable on-platform payment (LOCKED: not recurring, NO REFUND) and written to the
 * commission ledger atomically: a COMPLETED `Transaction` (kind=SESSION) + a 25%
 * `CommissionRecord` are created in the same `$transaction` as the atomic slot claim, so a
 * session booking can never leave payment without a ledger entry — nor a ledger entry without
 * a claimed slot (QC-20260719-21/22/31/42/47).
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug, slotId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
    };

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });
    if (!user) return jsonError("Masuk terlebih dahulu untuk membooking sesi.", 401);

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
    });
    if (!slot) return jsonError("Slot tidak ditemukan.", 404);
    if (slot.isBooked) return jsonError("Slot ini sudah dibooking.", 409);
    if (slot.startAt <= new Date()) {
      return jsonError("Slot sudah lewat dan tidak dapat dibooking.", 410);
    }

    // Active-booking cap: prevents one learner from hoarding a mentor's calendar
    // (which they could no-show on) (QC-20260719-21).
    const activeBookings = await db.mentorAvailabilitySlot.count({
      where: {
        bookedByUserId: user.id,
        isBooked: true,
        cancelledAt: null,
        startAt: { gt: new Date() },
      },
    });
    if (activeBookings >= ACTIVE_BOOKING_CAP) {
      return jsonError(
        `Kamu sudah punya ${ACTIVE_BOOKING_CAP} sesi mendatang. Selesaikan/batalkan salah satu dulu.`,
        409
      );
    }

    // One-time commitment fee derived from the mentor's typed session price
    // (QC-20260719-22/42). This IS the on-platform session payment; forfeited on
    // cancel/no-show, never refunded (LOCKED).
    const commitmentFee = mentor.sessionPriceInt ?? 0;
    const bookedAt = new Date();

    // Atomic claim + ledger: the slot claim, the session Transaction and its 25%
    // CommissionRecord all commit together. Only the first writer whose row still has
    // isBooked=false wins, closing the check-then-update TOCTOU race (QC-20260719-31).
    const outcome = await db.$transaction(async (tx) => {
      const claim = await tx.mentorAvailabilitySlot.updateMany({
        where: { id: slotId, mentorId: mentor.id, isBooked: false },
        data: {
          isBooked: true,
          bookedByUserId: user.id,
          bookedAt,
          cancelledAt: null,
          commitmentFee,
          attendanceStatus: "SCHEDULED",
        },
      });
      if (claim.count === 0) {
        return { claimed: false as const };
      }

      // Wire sessionPriceInt -> on-platform payment -> ledger (25% commission).
      // Free sessions (no typed price) create no ledger row.
      if (commitmentFee > 0) {
        const idempotencyKey = `session:${slotId}:${user.id}:${bookedAt.toISOString()}`;
        const transaction = await tx.transaction.create({
          data: {
            userId: user.id,
            courseId: null,
            mentorSessionId: slotId,
            mentorId: mentor.id,
            amount: commitmentFee,
            kind: "SESSION",
            status: "COMPLETED",
            idempotencyKey,
          },
        });
        await createCommissionRecordForTransaction(
          {
            transactionId: transaction.id,
            mentorId: mentor.id,
            grossAmount: commitmentFee,
          },
          tx
        );
      }

      return { claimed: true as const };
    });

    if (!outcome.claimed) {
      return jsonError("Slot ini baru saja dibooking orang lain.", 409);
    }

    const booked = await db.mentorAvailabilitySlot.findUniqueOrThrow({
      where: { id: slotId },
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

/**
 * Cancel a booking. The commitment fee is a settled, non-refundable on-platform payment
 * (LOCKED: NO REFUND) — cancelling never returns money. The 12-hour window only sets the
 * attendance signal (CANCELLED vs FORFEITED) for mentor reputation and frees the slot for
 * other learners; the recorded Transaction/CommissionRecord are left intact (QC-20260719-21/47).
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { slug, slotId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { userId?: string };

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId: body.userId,
    });
    if (!user) return jsonError("Masuk terlebih dahulu.", 401);

    const mentor = await db.mentorProfile.findUnique({ where: { slug } });
    if (!mentor) return jsonError("Mentor tidak ditemukan.", 404);

    const slot = await db.mentorAvailabilitySlot.findFirst({
      where: { id: slotId, mentorId: mentor.id },
    });
    if (!slot) return jsonError("Slot tidak ditemukan.", 404);
    if (!slot.isBooked || slot.bookedByUserId !== user.id) {
      return jsonError("Kamu tidak memegang booking ini.", 403);
    }

    const hoursUntilStart =
      (slot.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const lateCancel = hoursUntilStart < CANCEL_WINDOW_HOURS;

    // No money is ever returned (LOCKED: NO REFUND). We only release the slot and record
    // the attendance signal; the paid commitment fee stays as a settled Transaction.
    const released = await db.mentorAvailabilitySlot.update({
      where: { id: slotId },
      data: {
        isBooked: false,
        bookedByUserId: null,
        cancelledAt: new Date(),
        attendanceStatus: lateCancel ? "FORFEITED" : "CANCELLED",
      },
      include: { bookedBy: { select: { id: true, nama: true } } },
    });

    return jsonOk({
      slot: mapAvailabilitySlot(released),
      // The commitment fee is non-refundable regardless of timing (LOCKED: no refund).
      feeForfeited: slot.commitmentFee > 0,
      lateCancel,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
