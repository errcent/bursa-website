import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { findAdminPlaylistById, serializePlaylistDetail } from "@/lib/playlist/server";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { revalidateCatalog } from "@/lib/catalog/server";

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id, itemId } = await context.params;
    const playlist = await findAdminPlaylistById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist tidak ditemukan." }, { status: 404 });
    }

    await db.playlistItem.deleteMany({
      where: { id: itemId, playlistId: id },
    });

    const remaining = playlist.items
      .filter((item) => item.id !== itemId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    await db.$transaction(
      remaining.map((item, index) =>
        db.playlistItem.update({
          where: { id: item.id },
          data: { sortOrder: index },
        })
      )
    );

    const updated = await findAdminPlaylistById(id);
    revalidateCatalog();
    return NextResponse.json(serializePlaylistDetail(updated!));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus item." }, { status: 500 });
  }
}
