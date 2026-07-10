import { NextResponse } from "next/server";

import { mapCourse } from "@/lib/admin/server";
import { db } from "@/lib/db";
import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const courses = await db.course.findMany({
      where: { mentorId: mentor.mentorProfile!.id },
      include: {
        mentor: { include: { user: true } },
        modules: {
          include: { lessons: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(courses.map(mapCourse));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat kelas mentor." }, { status: 500 });
  }
}
