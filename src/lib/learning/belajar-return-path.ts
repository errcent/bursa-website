import type { ReadonlyURLSearchParams } from "next/navigation";

const RETURN_QUERY = "return";

export function resolveBelajarReturnPath(
  courseSlug: string,
  searchParams: Pick<ReadonlyURLSearchParams, "get">
): string {
  const raw = searchParams.get(RETURN_QUERY)?.trim();
  if (raw?.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }

  const playlist = searchParams.get("playlist")?.trim();
  if (playlist) {
    return `/playlist/${encodeURIComponent(playlist)}`;
  }

  return `/kelas/${courseSlug}`;
}

export function belajarLessonHref(
  courseSlug: string,
  lessonId: string,
  options?: { returnPath?: string; playlistSlug?: string | null }
): string {
  const params = new URLSearchParams();
  const returnPath = options?.returnPath ?? `/kelas/${courseSlug}`;
  params.set(RETURN_QUERY, returnPath);
  if (options?.playlistSlug) {
    params.set("playlist", options.playlistSlug);
  }
  return `/belajar/${courseSlug}/${lessonId}?${params.toString()}`;
}
