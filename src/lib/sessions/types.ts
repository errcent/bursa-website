export interface AvailabilitySlot {
  id: string;
  mentorId: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  bookedByUserId?: string | null;
  bookedByName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface SlotFormInput {
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface SessionBookingResult {
  slot: AvailabilitySlot;
  mentorName: string;
  mentorSlug: string;
}
