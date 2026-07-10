import { getSession } from "@/lib/auth/client";
import type { AvailabilitySlot, SessionBookingResult } from "./types";

function authHeaders(): HeadersInit {
  const session = getSession();
  if (!session) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    "x-user-email": session.email,
    "x-user-id": session.userId,
    ...(session.name ? { "x-user-name": session.name } : {}),
    ...(session.role ? { "x-user-role": session.role } : {}),
  };
}

export async function fetchMentorSlots(slug: string): Promise<{
  mentor: {
    slug: string;
    name: string;
    availableFor1on1: boolean;
    sessionPrice: string | null;
  };
  slots: AvailabilitySlot[];
}> {
  const res = await fetch(`/api/mentors/${slug}/availability-slots`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Gagal memuat jadwal.");
  }
  return res.json();
}

export async function bookMentorSlot(
  slug: string,
  slotId: string
): Promise<SessionBookingResult> {
  const session = getSession();
  const res = await fetch(`/api/mentors/${slug}/availability-slots/${slotId}/book`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: session?.email,
      userId: session?.userId,
      name: session?.name,
      role: session?.role,
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Gagal membooking sesi.");
  }

  return res.json();
}
