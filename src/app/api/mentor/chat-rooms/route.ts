import { NextResponse } from "next/server";

import { listMentorAccessibleHubs } from "@/lib/chat/db-rooms";
import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const rooms = await listMentorAccessibleHubs({
      mentorProfileId: mentor.mentorProfile!.id,
      userId: mentor.id,
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat ruang chat mentor." }, { status: 500 });
  }
}
