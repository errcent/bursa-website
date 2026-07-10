import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
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

function resolveIdentity(request: NextRequest, body?: { userId?: string; email?: string; name?: string; role?: string }) {
  const email =
    body?.email?.trim().toLowerCase() ||
    request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
    request.headers.get("x-user-email")?.trim().toLowerCase() ||
    undefined;
  const userId =
    body?.userId ||
    request.nextUrl.searchParams.get("userId") ||
    request.headers.get("x-user-id") ||
    "";
  const name =
    body?.name ||
    request.headers.get("x-user-name") ||
    undefined;
  const role =
    body?.role ||
    request.headers.get("x-user-role") ||
    undefined;

  return { userId, email, name, role };
}

/**
 * GET /api/me/profile — current user's base profile (nama, bio, avatarUrl).
 * Query/headers: userId, email (x-user-email). Creates DB user if missing.
 */
export async function GET(request: NextRequest) {
  try {
    const identity = resolveIdentity(request);
    if (!identity.userId && !identity.email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(identity, { createIfMissing: true });
    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
    }

    return jsonOk({ profile: serializeProfile(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/me/profile — update nama, username, phone, bio, and/or avatarUrl.
 * Body JSON: { userId?, email?, name?, username?, phone?, bio?, avatarUrl?, role? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = updateUserProfileSchema.parse(await request.json());
    const identity = resolveIdentity(request, body);

    if (!identity.userId && !identity.email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      {
        userId: identity.userId,
        email: identity.email,
        name: body.name ?? identity.name,
        role: identity.role,
      },
      { createIfMissing: true }
    );

    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
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
