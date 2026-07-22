import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  findAdminPlaylistById,
  serializePlaylistDetail,
} from "@/lib/playlist/server";
import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";
import { adminUpdatePlaylistSchema } from "@/lib/validations/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await context.params;
    const playlist = await findAdminPlaylistById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(serializePlaylistDetail(playlist));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat playlist." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await context.params;
    const input = adminUpdatePlaylistSchema.parse(await request.json());

    const existing = await findAdminPlaylistById(id);
    if (!existing) {
      return NextResponse.json({ error: "Playlist tidak ditemukan." }, { status: 404 });
    }

    const playlist = await db.playlist.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
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
    return NextResponse.json(serializePlaylistDetail(playlist));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui playlist." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await context.params;
    const existing = await findAdminPlaylistById(id);
    if (!existing) {
      return NextResponse.json({ error: "Playlist tidak ditemukan." }, { status: 404 });
    }

    await db.playlist.delete({ where: { id } });
    revalidateCatalog();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus playlist." }, { status: 500 });
  }
}
