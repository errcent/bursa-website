/**
 * Batch-download AI thumbnails into public/generated/thumbnails/.
 * Prompts are derived from course/playlist metadata in ai-manifest.ts.
 *
 * Usage: npm run thumbnails:generate
 */
import fs from "node:fs";
import path from "node:path";

import { THUMBNAIL_MANIFEST } from "../src/lib/thumbnails/ai-manifest";
import { negativePromptForStyle } from "../src/lib/thumbnails/negative-prompts";

const IMAGE_HOST = "image.pollinations.ai";
const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const THUMBNAIL_ROOT = path.resolve(process.cwd(), "public", "generated", "thumbnails");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/octet-stream",
]);

function pollinationsUrl(prompt: string, seed: number, negative: string): string {
  const params = new URLSearchParams({
    width: "1280",
    height: "720",
    nologo: "true",
    seed: String(seed),
    model: "turbo",
    negative: negative,
  });
  return `https://${IMAGE_HOST}/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

function assertAllowedImageUrl(urlString: string): URL {
  const url = new URL(urlString);
  if (url.protocol !== "https:" || url.hostname !== IMAGE_HOST) {
    throw new Error(`Refusing to fetch host ${url.hostname}`);
  }
  return url;
}

function thumbnailDest(kind: string, slug: string): string {
  const safeKind = path.basename(kind);
  const safeSlug = path.basename(slug);
  if (
    !SAFE_SEGMENT.test(safeKind) ||
    !SAFE_SEGMENT.test(safeSlug) ||
    safeKind !== kind ||
    safeSlug !== slug
  ) {
    throw new Error(`Unsafe thumbnail path: ${kind}/${slug}`);
  }
  const dest = path.resolve(THUMBNAIL_ROOT, safeKind, `${safeSlug}.webp`);
  const rootWithSep = THUMBNAIL_ROOT.endsWith(path.sep)
    ? THUMBNAIL_ROOT
    : `${THUMBNAIL_ROOT}${path.sep}`;
  if (dest !== THUMBNAIL_ROOT && !dest.startsWith(rootWithSep)) {
    throw new Error("Thumbnail path escaped output directory");
  }
  return dest;
}

function isImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12 || buffer.length > MAX_IMAGE_BYTES) return false;
  const riff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const webp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (riff && webp) return true;
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString("ascii") === "PNG") return true;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  return false;
}

function assertImageContentType(contentType: string | null): void {
  if (!contentType) return;
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_CONTENT_TYPES.has(mediaType)) {
    throw new Error(`Refusing content-type ${contentType}`);
  }
}

function writeValidatedThumbnail(dest: string, buffer: Buffer): void {
  if (!isImageBuffer(buffer)) {
    throw new Error("Response was not a validated image within size limits");
  }
  const rootWithSep = THUMBNAIL_ROOT.endsWith(path.sep)
    ? THUMBNAIL_ROOT
    : `${THUMBNAIL_ROOT}${path.sep}`;
  const resolved = path.resolve(dest);
  if (!resolved.startsWith(rootWithSep)) {
    throw new Error("Write path escaped output directory");
  }
  fs.writeFileSync(resolved, buffer);
}

async function downloadEntry(
  kind: string,
  slug: string,
  prompt: string,
  seed: number,
  negative: string
): Promise<void> {
  const dest = thumbnailDest(kind, slug);
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const url = assertAllowedImageUrl(pollinationsUrl(prompt, seed, negative));
  const res = await fetch(url, {
    headers: { Accept: "image/webp,image/png,image/jpeg" },
  });

  if (!res.ok) {
    throw new Error(`Failed ${kind}/${slug}: HTTP ${res.status}`);
  }

  assertImageContentType(res.headers.get("content-type"));

  const contentLength = Number(res.headers.get("content-length") || "0");
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error(`Failed ${kind}/${slug}: content-length exceeds limit`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Failed ${kind}/${slug}: body exceeds size limit`);
  }

  writeValidatedThumbnail(dest, buffer);
  console.log(`✓ ${kind}/${slug}.webp`);
}

async function main() {
  console.log(`Generating ${THUMBNAIL_MANIFEST.length} AI thumbnails…\n`);

  for (const entry of THUMBNAIL_MANIFEST) {
    if (entry.style === "masterclass-portrait") {
      console.log(
        `⊘ ${entry.kind}/${entry.slug}: skip - use FLUX.2 Max via /studio or BFL MCP`
      );
      continue;
    }
    try {
      await downloadEntry(
        entry.kind,
        entry.slug,
        entry.prompt,
        entry.seed,
        negativePromptForStyle(entry.style)
      );
      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.error(`✗ ${entry.kind}/${entry.slug}:`, error);
    }
  }

  const promptsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "thumbnail-prompts.json"
  );
  fs.mkdirSync(path.dirname(promptsPath), { recursive: true });
  fs.writeFileSync(
    promptsPath,
    JSON.stringify(
      THUMBNAIL_MANIFEST.map(({ kind, slug, title, prompt, destinationPath, style }) => ({
        kind,
        slug,
        title,
        destinationPath,
        prompt,
        style,
      })),
      null,
      2
    )
  );
  console.log(`\nPrompt manifest written to src/data/thumbnail-prompts.json`);
}

void main();
