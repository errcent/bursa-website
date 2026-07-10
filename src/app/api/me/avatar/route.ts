import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { db } from "@/lib/db";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

/**
 * POST /api/me/avatar — multipart upload for profile photo.
 * Form fields: file (required), userId?, email?, name?, role?
 * Also accepts x-user-email / x-user-id headers.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("File foto wajib diunggah.", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.", 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("Ukuran foto maksimal 2 MB.", 400);
    }

    const email =
      String(formData.get("email") ?? "").trim().toLowerCase() ||
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      undefined;
    const userId =
      String(formData.get("userId") ?? "").trim() ||
      request.headers.get("x-user-id") ||
      "";
    const name = String(formData.get("name") ?? "").trim() || undefined;
    const role = String(formData.get("role") ?? "").trim() || undefined;

    if (!userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      { userId, email, name, role },
      { createIfMissing: true }
    );
    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
    }

    const ext = extForType(file.type);
    const safeName = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);

    const avatarUrl = `/uploads/avatars/${safeName}`;

    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return jsonOk(
      {
        avatarUrl,
        profile: {
          id: updated.id,
          email: updated.email,
          name: updated.nama,
          bio: updated.bio ?? "",
          avatarUrl: updated.avatarUrl,
          role: updated.role,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
