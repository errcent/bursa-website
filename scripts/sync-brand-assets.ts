/**
 * Sync brand-kit PNG sources into Website/public and App/assets/images.
 *
 * Source: ../_assets/brand-kit (repo root)
 * Usage: npm run sync:brand
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const SOURCE_DIR = path.join(REPO_ROOT, "_assets", "brand-kit");
const WEB_PUBLIC = path.join(process.cwd(), "public");
const APP_IMAGES = path.join(REPO_ROOT, "App", "assets", "images");

/** LOCKUP-S audit: -3 = dark UI canonical; base = light bake; -1/-2 = duplicates (skip). */
const LOCKUP_S_DARK = "logo_lockup_stacked-3.png";
const LOCKUP_S_LIGHT = "logo_lockup_stacked.png";

const OG_MAX_BYTES = 300 * 1024;

type ManifestEntry = {
  source: string;
  output: string;
  note?: string;
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src: string, dest: string) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

async function compressOg(input: string, output: string, maxBytes: number) {
  ensureDir(path.dirname(output));
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 630;

  for (const quality of [85, 75, 65, 55, 45]) {
    const buf = await sharp(input)
      .resize(width, height, { fit: "fill" })
      .png({ compressionLevel: 9, quality, palette: quality <= 65 })
      .toBuffer();

    if (buf.length <= maxBytes) {
      fs.writeFileSync(output, buf);
      return buf.length;
    }
  }

  const buf = await sharp(input)
    .resize(width, height, { fit: "fill" })
    .webp({ quality: 80 })
    .toBuffer();

  if (buf.length <= maxBytes) {
    const webpOut = output.replace(/\.png$/i, ".webp");
    fs.writeFileSync(webpOut, buf);
    return buf.length;
  }

  const fallback = await sharp(input)
    .resize(width, height, { fit: "fill" })
    .png({ compressionLevel: 9, quality: 40, palette: true })
    .toBuffer();
  fs.writeFileSync(output, fallback);
  return fallback.length;
}

async function iconFromMark(
  source: string,
  size: number,
  output: string,
  opts?: { bg?: string; paddingRatio?: number }
) {
  const paddingRatio = opts?.paddingRatio ?? 0.19;
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const offset = Math.round((size - inner) / 2);

  let pipeline = sharp(source).resize(inner, inner, { fit: "contain" });

  if (opts?.bg) {
    const mark = await pipeline.toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: opts.bg,
      },
    })
      .composite([{ input: mark, left: offset, top: offset }])
      .png()
      .toFile(output);
    return;
  }

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: await pipeline.toBuffer(), left: offset, top: offset }])
    .png()
    .toFile(output);
}

async function androidForeground(source: string, output: string) {
  const size = 1024;
  const inner = 660;
  const offset = Math.round((size - inner) / 2);
  const mark = await sharp(source).resize(inner, inner, { fit: "contain" }).toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toFile(output);
}

async function androidBackground(output: string) {
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: "#0B1220",
    },
  })
    .png()
    .toFile(output);
}

async function androidMonochrome(source: string, output: string) {
  const size = 1024;
  const inner = 660;
  const offset = Math.round((size - inner) / 2);
  const mark = await sharp(source)
    .resize(inner, inner, { fit: "contain" })
    .greyscale()
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toFile(output);
}

async function writeFaviconIco(sizes: Array<{ size: number; file: string }>, output: string) {
  const pngBuffers = sizes.map(({ file }) => fs.readFileSync(file));
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries: Buffer[] = [];

  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i]!;
    const size = sizes[i]!.size;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buf.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  fs.writeFileSync(output, Buffer.concat([header, ...entries, ...pngBuffers]));
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Brand kit not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const manifest: ManifestEntry[] = [];

  const brandDir = path.join(WEB_PUBLIC, "brand");
  const ogDir = path.join(WEB_PUBLIC, "og");
  ensureDir(brandDir);
  ensureDir(ogDir);
  ensureDir(APP_IMAGES);

  const copies: Array<{ src: string; dest: string; note?: string }> = [
    { src: "logo_product_bursa_navbar.png", dest: "brand/logo_product_bursa_navbar.png" },
    { src: "logo_wordmark_bursanalar.png", dest: "brand/logo_wordmark_bursanalar.png" },
    { src: "logo_lockup_horizontal.png", dest: "brand/logo_lockup_horizontal.png" },
    { src: LOCKUP_S_DARK, dest: "brand/logo_lockup_stacked.png", note: "canonical LOCKUP-S dark UI" },
    { src: LOCKUP_S_LIGHT, dest: "brand/logo_lockup_stacked_light.png", note: "LOCKUP-S light bake" },
    { src: "logo_icon_mark.png", dest: "brand/logo_icon_mark.png" },
    { src: "logo_icon_mark_full.png", dest: "brand/logo_icon_mark_full.png" },
    { src: "web_email_header_dark.png", dest: "brand/web_email_header_dark.png" },
    { src: "web_email_header_light.png", dest: "brand/web_email_header_light.png" },
  ];

  for (const { src, dest, note } of copies) {
    const srcPath = path.join(SOURCE_DIR, src);
    const destPath = path.join(WEB_PUBLIC, dest);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Skip missing source: ${src}`);
      continue;
    }
    copyFile(srcPath, destPath);
    manifest.push({ source: src, output: dest.replace(/\\/g, "/"), note });
  }

  const ogDefaultSrc = path.join(SOURCE_DIR, "web_og_default.png");
  const ogTwitterSrc = path.join(SOURCE_DIR, "web_twitter_card.png");
  const ogDefaultOut = path.join(ogDir, "default.png");
  const ogTwitterOut = path.join(ogDir, "twitter.png");

  if (fs.existsSync(ogDefaultSrc)) {
    const size = await compressOg(ogDefaultSrc, ogDefaultOut, OG_MAX_BYTES);
    manifest.push({
      source: "web_og_default.png",
      output: "og/default.png",
      note: `${Math.round(size / 1024)}KB`,
    });
    console.log(`OG default: ${Math.round(size / 1024)}KB`);
  }

  if (fs.existsSync(ogTwitterSrc)) {
    const size = await compressOg(ogTwitterSrc, ogTwitterOut, OG_MAX_BYTES);
    manifest.push({
      source: "web_twitter_card.png",
      output: "og/twitter.png",
      note: `${Math.round(size / 1024)}KB`,
    });
    console.log(`OG twitter: ${Math.round(size / 1024)}KB`);
  }

  const iconMark = path.join(SOURCE_DIR, "logo_icon_mark.png");
  const iconMarkFull = path.join(SOURCE_DIR, "logo_icon_mark_full.png");
  const iconWhiteBlack = path.join(SOURCE_DIR, "logo_icon_white_on_black.png");
  // Full-bleed mark (no margin) - larger at 16/32px tab size.
  const faviconSource = fs.existsSync(iconMarkFull) ? iconMarkFull : iconMark;

  const fav16 = path.join(WEB_PUBLIC, "favicon-16x16.png");
  const fav32 = path.join(WEB_PUBLIC, "favicon-32x32.png");
  const favIcoPublic = path.join(WEB_PUBLIC, "favicon.ico");
  // Next.js App Router serves src/app/favicon.ico over public/ - keep both in sync.
  const favIcoApp = path.join(process.cwd(), "src", "app", "favicon.ico");
  await iconFromMark(faviconSource, 16, fav16, { paddingRatio: 0 });
  await iconFromMark(faviconSource, 32, fav32, { paddingRatio: 0 });
  await writeFaviconIco(
    [
      { size: 16, file: fav16 },
      { size: 32, file: fav32 },
    ],
    favIcoPublic
  );
  copyFile(favIcoPublic, favIcoApp);

  if (fs.existsSync(iconWhiteBlack)) {
    await sharp(iconWhiteBlack).resize(180, 180, { fit: "cover" }).png().toFile(
      path.join(WEB_PUBLIC, "apple-touch-icon.png")
    );
  } else {
    await iconFromMark(iconMark, 180, path.join(WEB_PUBLIC, "apple-touch-icon.png"), {
      bg: "#000000",
      paddingRatio: 0.11,
    });
  }

  await iconFromMark(iconMark, 192, path.join(WEB_PUBLIC, "icon-192.png"), {
    bg: "#000000",
    paddingRatio: 0.19,
  });
  await iconFromMark(iconMark, 512, path.join(WEB_PUBLIC, "icon-512.png"), {
    bg: "#000000",
    paddingRatio: 0.19,
  });

  const webmanifest = {
    name: "Bursa",
    short_name: "Bursa",
    description: "Katalog mentor dan kelas trading",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  fs.writeFileSync(
    path.join(WEB_PUBLIC, "site.webmanifest"),
    `${JSON.stringify(webmanifest, null, 2)}\n`
  );

  manifest.push(
    {
      source: path.basename(faviconSource),
      output: "favicon.ico + src/app/favicon.ico",
      note: "derived full-bleed (paddingRatio 0)",
    },
    { source: "logo_icon_mark.png", output: "icon-192.png", note: "derived" },
    { source: "logo_icon_mark.png", output: "icon-512.png", note: "derived" }
  );

  if (fs.existsSync(iconWhiteBlack)) {
    await sharp(iconWhiteBlack).resize(1024, 1024, { fit: "cover" }).png().toFile(
      path.join(APP_IMAGES, "icon.png")
    );
  } else {
    await iconFromMark(iconMark, 1024, path.join(APP_IMAGES, "icon.png"), {
      bg: "#000000",
      paddingRatio: 0.19,
    });
  }

  await androidForeground(iconMark, path.join(APP_IMAGES, "android-icon-foreground.png"));
  await androidBackground(path.join(APP_IMAGES, "android-icon-background.png"));
  await androidMonochrome(iconMark, path.join(APP_IMAGES, "android-icon-monochrome.png"));
  await iconFromMark(iconMark, 200, path.join(APP_IMAGES, "splash-icon.png"), {
    paddingRatio: 0.15,
  });
  await iconFromMark(iconMark, 48, path.join(APP_IMAGES, "favicon.png"));

  manifest.push(
    { source: "logo_icon_mark.png", output: "App/assets/images/*", note: "app icons derived" }
  );

  manifest.push({
    source: "audit",
    output: "brand/manifest.json",
    note: "LOCKUP-S: -3 dark canonical; -1/-2 duplicates skipped",
  });

  fs.writeFileSync(
    path.join(brandDir, "manifest.json"),
    `${JSON.stringify({ syncedAt: new Date().toISOString(), entries: manifest }, null, 2)}\n`
  );

  console.log("Brand assets synced.");
  console.log(`  Website: ${WEB_PUBLIC}`);
  console.log(`  App:     ${APP_IMAGES}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
