import { handleApiError, jsonError } from "@/lib/api-utils";

/** User playlist list is disabled — see GET /api/playlists for curated playlists. */
export async function GET() {
  return jsonError("Playlist pribadi tidak tersedia. Lihat /playlist untuk kurasi Bursa.", 410);
}

export async function POST() {
  return jsonError("Playlist hanya dapat dikurasi oleh admin.", 403);
}
