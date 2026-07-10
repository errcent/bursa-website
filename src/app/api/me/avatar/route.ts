import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { persistAvatar } from "@/lib/avatar-storage";
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
 *
 * On Vercel/serverless the image is stored as a data URL in the database
 * (filesystem under public/ is read-only). Locally files are written to
 * public/uploads/avatars/.
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
    const buffer = Buffer.from(await file.arrayBuffer());
    const { avatarUrl, storage } = await persistAvatar(user.id, buffer, file.type, ext);

    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return jsonOk(
      {
        avatarUrl,
        storage,
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
    if (error instanceof Error && error.message.includes("Body exceeded")) {
      return jsonError("Ukuran foto maksimal 2 MB.", 413);
    }
    return handleApiError(error);
  }
}
