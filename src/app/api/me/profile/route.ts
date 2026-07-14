import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { updateUserProfileSchema } from "@/lib/validations/api";
import { db } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedUser(request, { createIfMissing: true });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    return jsonOk({ profile: serializeProfile(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = updateUserProfileSchema.parse(await request.json());

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    if (
      body.name === undefined &&
      body.username === undefined &&
      body.phone === undefined &&
      body.bio === undefined &&
      body.avatarUrl === undefined
    ) {
      return jsonError("Tidak ada perubahan untuk disimpan.", 400);
    }

    if (body.username) {
      const conflict = await db.user.findFirst({
        where: { username: body.username, NOT: { id: user.id } },
        select: { id: true },
      });
      if (conflict) {
        return jsonError("Username sudah dipakai.", 409);
      }
    }

    if (body.phone) {
      const conflict = await db.user.findFirst({
        where: { phone: body.phone, NOT: { id: user.id } },
        select: { id: true },
      });
      if (conflict) {
        return jsonError("Nomor telepon sudah terdaftar.", 409);
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { nama: body.name.trim() } : {}),
        ...(body.username !== undefined ? { username: body.username || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.bio !== undefined ? { bio: body.bio.trim() } : {}),
        ...(body.avatarUrl !== undefined
          ? { avatarUrl: body.avatarUrl?.trim() || null }
          : {}),
      },
    });

    return jsonOk({ profile: serializeProfile(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
