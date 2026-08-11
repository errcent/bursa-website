/**
 * First-party silent placeholder for preview/demo playback.
 * Never fall back to third-party sample clips (breaks premium + CSP trust).
 */
export const DEMO_VIDEO_POSTER = "/og/default.png";
export const DEMO_VIDEO_URL = "/media/preview-placeholder.mp4";

export function resolvePlayableVideoUrl(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed || trimmed.startsWith("bunny:")) continue;
    if (trimmed.includes("interactive-examples.mdn.mozilla.net")) continue;
    return trimmed;
  }
  return DEMO_VIDEO_URL;
}

export function hasPlayableVideoUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}
