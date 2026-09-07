import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/send";
import { dsarStatusUpdateEmail } from "@/lib/privacy/email-templates";

const patchSchema = z.object({
  status: z.enum(["PENDING", "IN_REVIEW", "COMPLETED", "REJECTED"]).optional(),
  adminNotes: z.string().optional(),
  notify: z.boolean().optional(),
  locale: z.enum(["id", "en"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await params;

  try {
    const body = patchSchema.parse(await request.json());
    const existing = await db.dataSubjectRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan." }, { status: 404 });
    }

    const updated = await db.dataSubjectRequest.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes } : {}),
      },
    });

    if (body.notify && body.status && body.status !== existing.status) {
      const locale = body.locale ?? "id";
      const mail = dsarStatusUpdateEmail(locale, {
        fullName: updated.fullName,
        referenceCode: updated.referenceCode,
        status: updated.status,
      });
      void sendTransactionalEmail({
        category: "privacy_dsar",
        to: updated.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui permintaan." }, { status: 500 });
  }
}
