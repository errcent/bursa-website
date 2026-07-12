import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  findAdminPlaylistById,
  serializePlaylistDetail,
} from "@/lib/playlist/server";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";
import { adminPlaylistItemsSchema } from "@/lib/validations/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await context.params;
    const input = adminPlaylistItemsSchema.parse(await request.json());

    const playlist = await findAdminPlaylistById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist tidak ditemukan." }, { status: 404 });
    }

    const maxSort = playlist.items.reduce((max, item) => Math.max(max, item.sortOrder), -1);
    const creates: Array<{ lessonId?: string; courseId?: string; sortOrder: number }> = [];

    if (input.moduleId) {
      const mod = await db.module.findUnique({
        where: { id: input.moduleId },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      });
      if (!mod) {
        return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 });
      }
      mod.lessons.forEach((lesson, index) => {
        creates.push({ lessonId: lesson.id, sortOrder: maxSort + 1 + index });
      });
    } else if (input.lessonId) {
      creates.push({ lessonId: input.lessonId, sortOrder: maxSort + 1 });
    } else if (input.courseId) {
      creates.push({ courseId: input.courseId, sortOrder: maxSort + 1 });
    }

    if (creates.length === 0) {
      return NextResponse.json({ error: "Tidak ada item untuk ditambahkan." }, { status: 400 });
    }

    await db.playlistItem.createMany({
      data: creates.map((item) => ({
        playlistId: id,
        lessonId: item.lessonId ?? null,
        courseId: item.courseId ?? null,
        sortOrder: item.sortOrder,
      })),
    });

    const updated = await findAdminPlaylistById(id);
    revalidateCatalog();
    return NextResponse.json(serializePlaylistDetail(updated!));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambahkan item." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { itemIds?: string[] };

    const playlist = await findAdminPlaylistById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist tidak ditemukan." }, { status: 404 });
    }

    const itemIds = body.itemIds ?? [];
    if (itemIds.length === 0) {
      return NextResponse.json({ error: "Urutan item kosong." }, { status: 400 });
    }

    await db.$transaction(
      itemIds.map((itemId, index) =>
        db.playlistItem.updateMany({
          where: { id: itemId, playlistId: id },
          data: { sortOrder: index },
        })
      )
    );

    const updated = await findAdminPlaylistById(id);
    return NextResponse.json(serializePlaylistDetail(updated!));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengurutkan item." }, { status: 500 });
  }
}
