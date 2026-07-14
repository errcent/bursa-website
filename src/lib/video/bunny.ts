import { createHash, createHmac } from "crypto";

/** Default signed URL lifetime — aligned with playback token TTL (2 h). */
export const BUNNY_PLAYBACK_TTL_SECONDS = 2 * 60 * 60;

const BUNNY_VIDEO_PREFIX = "bunny:";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BunnyConfig {
  libraryId: string;
  apiKey: string;
  tokenKey: string;
  cdnHostname: string;
}

export interface BunnyPlaybackResult {
  url: string;
  provider: "bunny";
  expiresAt: string;
  /** Signed iframe URL — for future embed player; not used by native `<video>`. */
  embedUrl?: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getBunnyConfig(): Partial<BunnyConfig> {
  return {
    libraryId: readEnv("BUNNY_STREAM_LIBRARY_ID"),
    apiKey: readEnv("BUNNY_STREAM_API_KEY"),
    tokenKey: readEnv("BUNNY_STREAM_TOKEN_KEY"),
    cdnHostname: readEnv("BUNNY_STREAM_CDN_HOSTNAME"),
  };
}

/** True when library + token key + CDN hostname are set (signed playback). */
export function isBunnyPlaybackConfigured(): boolean {
  const { libraryId, tokenKey, cdnHostname } = getBunnyConfig();
  return Boolean(libraryId && tokenKey && cdnHostname);
}

/** True when library + API key are set (server-side upload). */
export function isBunnyUploadConfigured(): boolean {
  const { libraryId, apiKey } = getBunnyConfig();
  return Boolean(libraryId && apiKey);
}

/**
 * Extract Bunny Stream video GUID from stored lesson `videoUrl` values:
 * - `bunny:{guid}`
 * - raw UUID
 * - iframe / CDN URLs
 */
export function parseBunnyVideoId(stored: string | null | undefined): string | null {
  const value = stored?.trim();
  if (!value) return null;

  if (value.startsWith(BUNNY_VIDEO_PREFIX)) {
    const id = value.slice(BUNNY_VIDEO_PREFIX.length).trim();
    return UUID_PATTERN.test(id) ? id : null;
  }

  if (UUID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value);
    const embedMatch = url.pathname.match(/\/embed\/\d+\/([0-9a-f-]{36})/i);
    if (embedMatch?.[1]) return embedMatch[1];

    const cdnMatch = url.pathname.match(/^\/([0-9a-f-]{36})(?:\/|$)/i);
    if (cdnMatch?.[1]) return cdnMatch[1];
  } catch {
    // Not a URL — ignore.
  }

  return null;
}

/** Embed-view token: SHA256_HEX(tokenKey + videoId + expires). */
export function signBunnyEmbedUrl(
  videoId: string,
  ttlSeconds = BUNNY_PLAYBACK_TTL_SECONDS
): string | null {
  const { libraryId, tokenKey } = getBunnyConfig();
  if (!libraryId || !tokenKey) return null;

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = createHash("sha256")
    .update(`${tokenKey}${videoId}${expires}`)
    .digest("hex");

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}

/** CDN file token (query-string style) for direct MP4 playback in native `<video>`. */
export function signBunnyCdnUrl(
  fileUrl: string,
  ttlSeconds = BUNNY_PLAYBACK_TTL_SECONDS
): string | null {
  const { tokenKey } = getBunnyConfig();
  if (!tokenKey) return null;

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const parsed = new URL(fileUrl);
  const signaturePath = parsed.pathname;
  const hashable = signaturePath + expires;

  const raw = createHmac("sha256", tokenKey).update(hashable).digest("base64");
  const token =
    "HS256-" + raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  parsed.searchParams.set("token", token);
  parsed.searchParams.set("expires", String(expires));
  return parsed.toString();
}

export function resolveSignedPlaybackUrl(
  storedVideoUrl: string | null | undefined,
  ttlSeconds = BUNNY_PLAYBACK_TTL_SECONDS
): BunnyPlaybackResult | null {
  const videoId = parseBunnyVideoId(storedVideoUrl);
  if (!videoId || !isBunnyPlaybackConfigured()) return null;

  const { cdnHostname } = getBunnyConfig();
  if (!cdnHostname) return null;

  const mp4Path = `https://${cdnHostname}/${videoId}/play_720p.mp4`;
  const signedUrl = signBunnyCdnUrl(mp4Path, ttlSeconds);
  if (!signedUrl) return null;

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const embedUrl = signBunnyEmbedUrl(videoId, ttlSeconds) ?? undefined;

  return {
    url: signedUrl,
    provider: "bunny",
    expiresAt,
    embedUrl,
  };
}

export function formatBunnyStoredVideoId(videoId: string): string {
  return `${BUNNY_VIDEO_PREFIX}${videoId}`;
}

export async function uploadVideoToBunny(
  file: File,
  buffer: Buffer
): Promise<{ videoId: string; storedUrl: string }> {
  const { libraryId, apiKey } = getBunnyConfig();
  if (!libraryId || !apiKey) {
    throw new Error("Bunny Stream upload is not configured.");
  }

  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: file.name }),
    }
  );

  if (!createRes.ok) {
    throw new Error(`Bunny create video failed (${createRes.status}).`);
  }

  const created = (await createRes.json()) as { guid?: string };
  const videoId = created.guid?.trim();
  if (!videoId) {
    throw new Error("Bunny create video response missing guid.");
  }

  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
    }
  );

  if (!uploadRes.ok) {
    throw new Error(`Bunny upload failed (${uploadRes.status}).`);
  }

  return {
    videoId,
    storedUrl: formatBunnyStoredVideoId(videoId),
  };
}
