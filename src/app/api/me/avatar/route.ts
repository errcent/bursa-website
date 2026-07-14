import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import {
  AVATAR_MAX_INPUT_BYTES,
  processAvatarImage,
} from "@/lib/avatar-processing";
import { deleteLocalAvatarFile, persistAvatar } from "@/lib/avatar-storage";
import { db } from "@/lib/db";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function serializeProfile(user: {
  id: string;
  email: string;
  nama: string;
  username: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.nama,
    username: user.username,
    phone: user.phone,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

/**
 * POST /api/me/avatar — multipart upload for profile photo.
 * Form fields: file (required), userId?, email?, name?, role?
 * Also accepts x-user-email / x-user-id headers.
 *
 * Images are resized/compressed server-side before storage.
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

    if (file.size > AVATAR_MAX_INPUT_BYTES) {
      return jsonError("Ukuran foto maksimal 5 MB.", 400);
    }

    const claimedUserId =
      String(formData.get("userId") ?? "").trim() ||
      request.headers.get("x-user-id") ||
      undefined;

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const processed = await processAvatarImage(rawBuffer);

    if (user.avatarUrl) {
      await deleteLocalAvatarFile(user.avatarUrl);
    }

    const { avatarUrl, storage } = await persistAvatar(
      user.id,
      processed.buffer,
      processed.mimeType,
      processed.ext
    );

    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return jsonOk(
      {
        avatarUrl,
        storage,
        compression: {
          originalBytes: processed.originalBytes,
          compressedBytes: processed.compressedBytes,
        },
        profile: serializeProfile(updated),
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Body exceeded")) {
      return jsonError("Ukuran foto maksimal 5 MB.", 413);
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/me/avatar — remove the current user's profile photo.
 * Accepts identity via headers (x-user-email, x-user-id) or query params.
 */
export async function DELETE(request: NextRequest) {
  try {
    const claimedUserId =
      request.nextUrl.searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      undefined;

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    if (!user.avatarUrl) {
      return jsonOk({ profile: serializeProfile(user), deleted: false });
    }

    await deleteLocalAvatarFile(user.avatarUrl);

    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });

    return jsonOk({ profile: serializeProfile(updated), deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
