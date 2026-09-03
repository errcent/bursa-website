/**
 * First-party silent placeholder for preview/demo playback.
 * Never fall back to third-party sample clips (breaks premium + CSP trust).
 */
export const DEMO_VIDEO_POSTER = "/og/default.png";
export const DEMO_VIDEO_URL = "/media/preview-placeholder.mp4";

const BLOCKED_DEMO_HOSTS = new Set(["interactive-examples.mdn.mozilla.net"]);

function hostnameOfAbsoluteUrl(candidate: string): string | null {
  try {
    // Exact hostname compare — substring checks are spoofable
    // (js/incomplete-url-substring-sanitization).
    // Base covers protocol-relative `//host/...` candidates.
    return new URL(candidate, "https://invalid.example").hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolvePlayableVideoUrl(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed || trimmed.startsWith("bunny:")) continue;
    // Path-absolute only (`/...`); reject protocol-relative `//host/...`.
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
    if (trimmed.startsWith("blob:")) return trimmed;
    const hostname = hostnameOfAbsoluteUrl(trimmed);
    if (!hostname) continue;
    if (BLOCKED_DEMO_HOSTS.has(hostname)) continue;
    return trimmed;
  }
  return DEMO_VIDEO_URL;
}

export function hasPlayableVideoUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}
