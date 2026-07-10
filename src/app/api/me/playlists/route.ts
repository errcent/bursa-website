import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import {
  listUserPlaylists,
  resolveUniquePlaylistSlug,
  serializePlaylistDetail,
  serializePlaylistSummary,
} from "@/lib/playlist/server";
import { createPlaylistSchema } from "@/lib/validations/api";

/**
 * User playlists: GET list / POST create.
 * Query/headers: ?userId=&email= or x-user-email.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    const email =
      request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      undefined;

    if (!userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      { userId: userId ?? "", email },
      { createIfMissing: false }
    );

    if (!user) {
      return jsonOk({ playlists: [] });
    }

    const playlists = await listUserPlaylists(user.id);
    return jsonOk({ playlists: playlists.map(serializePlaylistSummary) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createPlaylistSchema.parse(await request.json());
    const headerEmail = request.headers.get("x-user-email")?.trim().toLowerCase();
    const email = body.email?.trim().toLowerCase() || headerEmail;

    if (!body.userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser({
      userId: body.userId ?? "",
      email,
      name: body.name,
      role: body.role,
    });

    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
    }

    const slug = await resolveUniquePlaylistSlug(user.id, body.title, body.slug);

    const playlist = await db.playlist.create({
      data: {
        userId: user.id,
        title: body.title,
        description: body.description ?? null,
        slug,
        items: body.items?.length
          ? {
              create: body.items.map((item, index) => ({
                lessonId: item.lessonId ?? null,
                courseId: item.courseId ?? null,
                sortOrder: index,
              })),
            }
          : undefined,
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

    return jsonOk({ playlist: serializePlaylistDetail(playlist) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
