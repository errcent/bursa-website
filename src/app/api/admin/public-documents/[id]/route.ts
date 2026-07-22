import { NextResponse } from "next/server";

import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const doc = await db.publicDocument.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat dokumen." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      title?: string;
      eyebrow?: string;
      description?: string;
      markdownBody?: string;
      sortOrder?: number;
      status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
    };

    const doc = await db.publicDocument.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.eyebrow !== undefined ? { eyebrow: body.eyebrow } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.markdownBody !== undefined ? { markdownBody: body.markdownBody } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        version: { increment: body.markdownBody !== undefined ? 1 : 0 },
      },
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui dokumen." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    await db.publicDocument.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengarsipkan dokumen." }, { status: 500 });
  }
}
