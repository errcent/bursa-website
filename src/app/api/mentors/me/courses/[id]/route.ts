import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  instrumentFromUi,
  levelFromUi,
  mapCourse,
} from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";
import { db } from "@/lib/db";
import { forbidden, requireMentor, unauthorizedMentor } from "@/lib/mentor/server";
import type { Instrument, Level } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  const { id } = await context.params;
  const mentorId = mentor.mentorProfile!.id;

  try {
    const existing = await db.course.findUnique({
      where: { id },
      select: { id: true, mentorId: true, slug: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    if (existing.mentorId !== mentorId) {
      return forbidden("Kamu tidak punya akses ke kelas ini.");
    }

    const body = (await request.json()) as {
      title?: string;
      shortDescription?: string;
      level?: Level;
      instrument?: Instrument;
    };

    if (body.title !== undefined) {
      const len = body.title.trim().length;
      if (len < 10 || len > 120) {
        return NextResponse.json(
          { error: "Judul kelas harus 10–120 karakter." },
          { status: 422 }
        );
      }
    }

    if (body.shortDescription !== undefined) {
      const len = body.shortDescription.trim().length;
      if (len < 50 || len > 500) {
        return NextResponse.json(
          { error: "Deskripsi singkat harus 50–500 karakter." },
          { status: 422 }
        );
      }
    }

    await db.course.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        shortDescription: body.shortDescription?.trim(),
        level: body.level ? levelFromUi(body.level) : undefined,
        instrument: body.instrument ? instrumentFromUi(body.instrument) : undefined,
      },
    });

    const course = await db.course.findUniqueOrThrow({
      where: { id },
      include: {
        mentor: { include: { user: true } },
        modules: { include: { lessons: true } },
      },
    });

    revalidateCatalog();
    revalidatePath(`/kelas/${course.slug}`);

    const mapped = mapCourse(course);
    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui kelas." }, { status: 500 });
  }
}
