/**
 * Save MasterClass portrait thumbnails from BFL signed URLs (FLUX.2 Max only).
 *
 * Usage:
 *   THUMB_URL_1=<url> THUMB_SLUG_1=forex-makro-dasar \
 *   THUMB_URL_2=<url> THUMB_SLUG_2=defi-dan-tokenomics-pemula \
 *   npx tsx scripts/save-portrait-thumbnails-from-bfl.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

type ThumbItem = { slug: string; url: string };

function collectItems(): ThumbItem[] {
  const items: ThumbItem[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const slug = process.env[`THUMB_SLUG_${i}`]?.trim();
    const url = process.env[`THUMB_URL_${i}`]?.trim();
    if (slug && url) items.push({ slug, url });
  }
  return items;
}

async function main() {
  const items = collectItems();
  if (items.length === 0) {
    throw new Error(
      "Set THUMB_SLUG_N and THUMB_URL_N env vars (e.g. THUMB_SLUG_1 + THUMB_URL_1)"
    );
  }

  const outDir = path.join("public", "generated", "thumbnails", "course");
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of items) {
    const res = await fetch(item.url, { headers: { Accept: "image/*" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${item.slug}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const dest = path.join(outDir, `${item.slug}.webp`);
    await sharp(buffer)
      .resize(1920, 1080, { fit: "cover" })
      .webp({ quality: 90 })
      .toFile(dest);
    console.log(`saved ${dest}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
