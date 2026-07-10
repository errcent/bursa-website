import { VerificationStatus, type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { mapMentor, requireAdmin, unauthorized } from "@/lib/admin/server";
import type { MentorFormInput } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const input = (await request.json()) as Partial<MentorFormInput>;
    const profile = await db.mentorProfile.update({
      where: { id },
      data: {
        title: input.title,
        bio: input.bio,
        philosophy: input.philosophy,
        instruments: input.instruments,
        licenseLabel: input.licenseLabel,
        yearsExperience: input.yearsExperience,
        availableFor1on1: input.availableFor1on1,
        sessionPrice: input.sessionPrice,
        verificationStatus:
          input.verified === undefined
            ? undefined
            : input.verified
              ? VerificationStatus.VERIFIED
              : VerificationStatus.PENDING,
      },
      include: { user: true },
    });

    if (input.name || input.email) {
      await db.user.update({
        where: { id: profile.userId },
        data: {
          nama: input.name,
          email: input.email?.trim().toLowerCase(),
        },
      });
    }

    const updated = await db.mentorProfile.findUniqueOrThrow({
      where: { id },
      include: { user: true },
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_MENTOR",
        entityType: "mentor",
        entityId: id,
        changes: input as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(mapMentor(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui mentor." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const profile = await db.mentorProfile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ error: "Mentor tidak ditemukan." }, { status: 404 });
    }

    await db.mentorProfile.delete({ where: { id } });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_MENTOR",
        entityType: "mentor",
        entityId: id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus mentor." }, { status: 500 });
  }
}
