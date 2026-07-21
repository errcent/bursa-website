import type { Prisma } from "@prisma/client";

import type { AvailabilitySlot } from "./types";

type SlotWithBookedBy = Prisma.MentorAvailabilitySlotGetPayload<{
  include: { bookedBy: { select: { id: true; nama: true } } };
}>;

export function mapAvailabilitySlot(slot: SlotWithBookedBy): AvailabilitySlot {
  return {
    id: slot.id,
    mentorId: slot.mentorId,
    startAt: slot.startAt.toISOString(),
    endAt: slot.endAt.toISOString(),
    isBooked: slot.isBooked,
    bookedByUserId: slot.bookedByUserId,
    bookedByName: slot.bookedBy?.nama ?? null,
    notes: slot.notes,
    createdAt: slot.createdAt.toISOString(),
    commitmentFee: slot.commitmentFee,
    attendanceStatus: slot.attendanceStatus,
  };
}

/** Parse date + time strings (WIB local) into UTC Date objects. */
export function parseSlotDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  // WIB = UTC+7
  return new Date(Date.UTC(year, month - 1, day, hours - 7, minutes));
}

export function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function formatSlotRange(startAt: string, endAt: string): string {
  return `${formatSlotTime(startAt)} – ${formatSlotTime(endAt)} WIB`;
}
