import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import {
  buildPlaylistAccessContext,
  enrichPlaylistItemsWithAccess,
} from "@/lib/playlist/access";
import {
  findCuratedPlaylistBySlug,
  serializePlaylistDetail,
} from "@/lib/playlist/server";

type RouteContext = { params: Promise<{ slug: string }> };

/** Public curated playlist detail. */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const playlist = await findCuratedPlaylistBySlug(slug);
    if (!playlist) {
      return jsonError("Playlist tidak ditemukan.", 404);
    }

    const detail = serializePlaylistDetail(playlist);
    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    const accessCtx = await buildPlaylistAccessContext(user?.id ?? null, detail.items);

    return jsonOk({
      playlist: {
        ...detail,
        items: enrichPlaylistItemsWithAccess(detail.items, accessCtx),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
