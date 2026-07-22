import { UserRole, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import {
  mapMentor,
  requireAdmin,
  requireAdminPanel,
  slugify,
  unauthorized,
} from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";
import type { MentorFormInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const mentors = await db.mentorProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(mentors.map(mapMentor));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat mentor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const input = (await request.json()) as MentorFormInput;
    const email = input.email.trim().toLowerCase();
    const slug = slugify(input.name);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash("password123", 10);
    const initials = input.name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");

    const user = await db.user.create({
      data: {
        email,
        nama: input.name.trim(),
        passwordHash,
        role: UserRole.MENTOR,
      },
    });

    const profile = await db.mentorProfile.create({
      data: {
        userId: user.id,
        slug,
        title: input.title,
        initials,
        bio: input.bio,
        philosophy: input.philosophy,
        spesialisasi: input.title,
        instruments: input.instruments,
        licenseLabel: input.licenseLabel,
        verificationStatus: input.verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.PENDING,
        yearsExperience: input.yearsExperience,
        availableFor1on1: input.availableFor1on1,
        sessionPrice: input.sessionPrice,
        trackRecord: [0, 0, 0, 0, 0, 0],
      },
      include: { user: true },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_MENTOR",
        entityType: "mentor",
        entityId: profile.id,
      },
    });

    revalidateCatalog();

    return NextResponse.json(mapMentor(profile), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat mentor." }, { status: 500 });
  }
}
