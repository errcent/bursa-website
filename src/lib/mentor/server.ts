import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { mapCourse } from "@/lib/admin/server";

export async function requireMentor(request: Request) {
  const email = request.headers.get("x-user-email")?.trim().toLowerCase();
  if (!email) return null;

  const user = await db.user.findUnique({
    where: { email },
    include: { mentorProfile: true },
  });
  if (!user || user.role !== UserRole.MENTOR || !user.mentorProfile) return null;
  return user;
}

export async function requireAdminOrMentor(request: Request) {
  const email = request.headers.get("x-user-email")?.trim().toLowerCase();
  if (!email) return null;

  const user = await db.user.findUnique({
    where: { email },
    include: { mentorProfile: true },
  });
  if (!user) return null;
  if (user.role === UserRole.ADMIN) return user;
  if (user.role === UserRole.MENTOR && user.mentorProfile) return user;
  return null;
}

export function unauthorizedMentor() {
  return NextResponse.json({ error: "Akses mentor diperlukan." }, { status: 401 });
}

export function forbidden(message = "Akses ditolak.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export { mapCourse };
