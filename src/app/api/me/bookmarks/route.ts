import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { refToDbFields, rowToBookmarkEntry } from "@/lib/bookmarks/server";
import { bookmarkId } from "@/lib/bookmarks/types";
import { db } from "@/lib/db";
import { toggleBookmarkSchema } from "@/lib/validations/api";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (!user) return jsonError("Autentikasi diperlukan.", 401);

    const typeParam = request.nextUrl.searchParams.get("type");
    const rows = await db.bookmarkItem.findMany({
      where: {
        userId: user.id,
        ...(typeParam
          ? { type: typeParam.toUpperCase() as "COURSE" | "LESSON" | "PLAYLIST" | "MENTOR" }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      items: rows.map((row) => ({
        id: row.id,
        ...rowToBookmarkEntry(row),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Idempotent toggle — returns `{ saved: boolean }`. */
export async function POST(request: NextRequest) {
  try {
    const body = toggleBookmarkSchema.parse(await request.json());
    const user = await resolveAuthenticatedUser(request, { createIfMissing: true });
    if (!user) return jsonError("Autentikasi diperlukan.", 401);

    const fields = refToDbFields(body);
    const existing = await db.bookmarkItem.findUnique({
      where: { userId_targetKey: { userId: user.id, targetKey: fields.targetKey } },
    });

    if (existing) {
      await db.bookmarkItem.delete({ where: { id: existing.id } });
      return jsonOk({ saved: false, id: bookmarkId(body) });
    }

    const created = await db.bookmarkItem.create({
      data: { userId: user.id, ...fields },
    });

    return jsonOk({ saved: true, id: created.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
