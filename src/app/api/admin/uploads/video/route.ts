import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File video wajib diunggah." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan MP4, WebM, atau MOV." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 200 MB." }, { status: 400 });
    }

    const ext =
      file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);

    const url = `/uploads/videos/${safeName}`;

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPLOAD_VIDEO",
        entityType: "video",
        entityId: safeName,
        changes: {
          url,
          size: file.size,
          type: file.type,
          originalName: file.name,
        } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ url, fileName: safeName }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengunggah video." }, { status: 500 });
  }
}
