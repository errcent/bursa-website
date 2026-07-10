import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import {
  findUserPlaylistBySlug,
  serializePlaylistDetail,
} from "@/lib/playlist/server";
import { deletePlaylistSchema, updatePlaylistSchema } from "@/lib/validations/api";

type RouteContext = { params: Promise<{ slug: string }> };

async function resolveOwner(request: NextRequest, body?: Record<string, unknown>) {
  const userId =
    (typeof body?.userId === "string" ? body.userId : undefined) ??
    request.nextUrl.searchParams.get("userId") ??
    undefined;
  const email =
    (typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined) ||
    request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
    request.headers.get("x-user-email")?.trim().toLowerCase() ||
    undefined;

  if (!userId && !email) {
    return { error: jsonError("Autentikasi diperlukan.", 401) as Response };
  }

  const user = await resolveRequestUser(
    { userId: userId ?? "", email },
    { createIfMissing: false }
  );

  if (!user) {
    return { error: jsonError("Pengguna tidak ditemukan.", 404) as Response };
  }

  return { user };
}

/**
 * GET /api/me/playlists/[slug] — playlist detail for the signed-in user.
 * PATCH — update title/description.
 * DELETE — remove playlist.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const resolved = await resolveOwner(request);
    if ("error" in resolved) return resolved.error;

    const playlist = await findUserPlaylistBySlug(resolved.user.id, slug);
    if (!playlist) {
      return jsonError("Playlist tidak ditemukan.", 404);
    }

    return jsonOk({ playlist: serializePlaylistDetail(playlist) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = updatePlaylistSchema.parse(await request.json());
    const resolved = await resolveOwner(request, body);
    if ("error" in resolved) return resolved.error;

    const existing = await findUserPlaylistBySlug(resolved.user.id, slug);
    if (!existing) {
      return jsonError("Playlist tidak ditemukan.", 404);
    }

    const playlist = await db.playlist.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        slug: true,
                        title: true,
                        mentor: {
                          select: { slug: true, user: { select: { nama: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
            course: {
              include: {
                mentor: { select: { slug: true, user: { select: { nama: true } } } },
              },
            },
          },
        },
      },
    });

    return jsonOk({ playlist: serializePlaylistDetail(playlist) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = deletePlaylistSchema.safeParse(await request.json().catch(() => ({})));
    const resolved = await resolveOwner(request, body.success ? body.data : undefined);
    if ("error" in resolved) return resolved.error;

    const existing = await findUserPlaylistBySlug(resolved.user.id, slug);
    if (!existing) {
      return jsonError("Playlist tidak ditemukan.", 404);
    }

    await db.playlist.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
