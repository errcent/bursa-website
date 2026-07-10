/**
 * Public demo MP4 for preview lessons and paid-lesson fallbacks in dev.
 * The former GCS sample bucket now returns 403 in many environments.
 */
export const DEMO_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export function resolvePlayableVideoUrl(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return DEMO_VIDEO_URL;
}
