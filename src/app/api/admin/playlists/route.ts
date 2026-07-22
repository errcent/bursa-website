import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  listAdminPlaylists,
  resolveUniquePlaylistSlug,
  serializePlaylistDetail,
  serializePlaylistSummary,
} from "@/lib/playlist/server";
import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";
import { adminCreatePlaylistSchema } from "@/lib/validations/api";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const playlists = await listAdminPlaylists();
    return NextResponse.json(playlists.map(serializePlaylistSummary));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat playlist." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const input = adminCreatePlaylistSchema.parse(await request.json());
    const slug = await resolveUniquePlaylistSlug(input.title, input.slug);

    const playlist = await db.playlist.create({
      data: {
        userId: admin.id,
        title: input.title,
        description: input.description ?? null,
        slug,
        isCurated: true,
        isPublished: input.isPublished ?? false,
        items: input.items?.length
          ? {
              create: input.items.map((item, index) => ({
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

    revalidateCatalog();
    return NextResponse.json(serializePlaylistDetail(playlist), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat playlist." }, { status: 500 });
  }
}
