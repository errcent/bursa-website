import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  findCuratedPlaylistBySlug,
  serializePlaylistDetail,
} from "@/lib/playlist/server";

type RouteContext = { params: Promise<{ slug: string }> };

/** Public curated playlist detail. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const playlist = await findCuratedPlaylistBySlug(slug);
    if (!playlist) {
      return jsonError("Playlist tidak ditemukan.", 404);
    }
    return jsonOk({ playlist: serializePlaylistDetail(playlist) });
  } catch (error) {
    return handleApiError(error);
  }
}
