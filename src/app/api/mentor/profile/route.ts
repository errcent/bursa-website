import { NextResponse } from "next/server";

import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  const profile = mentor.mentorProfile!;
  return NextResponse.json({
    id: profile.id,
    slug: profile.slug,
    title: profile.title,
    initials: profile.initials,
    avatarUrl: profile.avatarUrl,
    userId: mentor.id,
    name: mentor.nama,
    email: mentor.email,
  });
}
