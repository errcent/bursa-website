import { handleApiError, jsonOk } from "@/lib/api-utils";
import { listCuratedPlaylists, serializePlaylistSummary } from "@/lib/playlist/server";

/** Public curated playlists for catalog and /playlist. */
export async function GET() {
  try {
    const playlists = await listCuratedPlaylists();
    return jsonOk({ playlists: playlists.map(serializePlaylistSummary) });
  } catch (error) {
    return handleApiError(error);
  }
}
