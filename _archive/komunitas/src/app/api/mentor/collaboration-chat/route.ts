import { NextResponse } from "next/server";

import { getMentorAdminChatRoomSummaryForMentor } from "@/lib/mentor/collaboration-chat";
import { forbidden, requireMentor } from "@/lib/mentor/server";

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor?.mentorProfile) return forbidden("Akses mentor diperlukan.");

  try {
    const room = await getMentorAdminChatRoomSummaryForMentor(mentor.mentorProfile.id);
    return NextResponse.json({ ...room, currentUserId: mentor.id });
  } catch (error) {
    console.error("[mentor/collaboration-chat]", error);
    return NextResponse.json(
      {
        error: "Gagal memuat ruang kolaborasi mentor–admin.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}
