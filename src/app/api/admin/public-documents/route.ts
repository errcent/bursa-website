import { NextResponse } from "next/server";
import type { DocumentPortal, DocumentStatus } from "@prisma/client";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { searchParams } = new URL(request.url);
  const portal = searchParams.get("portal") as DocumentPortal | null;
  const status = searchParams.get("status") as DocumentStatus | null;

  try {
    const docs = await db.publicDocument.findMany({
      where: {
        ...(portal ? { portal } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ portal: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json(docs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat dokumen." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = (await request.json()) as {
      portal: DocumentPortal;
      slug: string;
      title: string;
      eyebrow: string;
      description: string;
      markdownBody: string;
      sortOrder?: number;
    };

    const doc = await db.publicDocument.create({
      data: {
        portal: body.portal,
        slug: body.slug,
        title: body.title,
        eyebrow: body.eyebrow,
        description: body.description,
        markdownBody: body.markdownBody,
        sortOrder: body.sortOrder ?? 0,
        status: "DRAFT",
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat dokumen." }, { status: 500 });
  }
}
