/**
 * Process photorealistic device PNGs: flood-fill background removal + screen holes.
 * Run: node scripts/process-device-mockups.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, "../public/mockups/sources");
const outDir = join(__dirname, "../public/mockups");
mkdirSync(outDir, { recursive: true });

const SOURCES = {
  macbook: {
    input: join(assetsDir, "macbook-pro-16-source.png"),
    output: "macbook-pro-16-space-black.png",
    screen: { x: 9.15, y: 4.75, w: 81.7, h: 54.35, radius: 1.1 },
    notch: { x: 43.4, y: 0.6, w: 13.2, h: 4.4 },
  },
  iphone: {
    input: join(assetsDir, "iphone-15-pro-source.png"),
    output: "iphone-15-pro-titanium.png",
    screen: { x: 7.1, y: 3.15, w: 85.8, h: 93.7, radius: 3.8 },
    island: { x: 27.8, y: 4.2, w: 44.4, h: 6.1 },
  },
};

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

function isSimilar(r, g, b, sr, sg, sb, tolerance) {
  return colorDistance(r, g, b, sr, sg, sb) <= tolerance;
}

function floodRemoveBackground(data, width, height, tolerance = 42) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const seed = (x, y) => {
    const idx = (y * width + x) * 4;
    queue.push([x, y, data[idx], data[idx + 1], data[idx + 2]]);
  };

  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y, sr, sg, sb] = queue.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    const pi = y * width + x;
    if (visited[pi]) continue;
    visited[pi] = 1;

    const idx = pi * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (!isSimilar(r, g, b, sr, sg, sb, tolerance)) continue;

    data[idx + 3] = 0;

    queue.push([x + 1, y, sr, sg, sb]);
    queue.push([x - 1, y, sr, sg, sb]);
    queue.push([x, y + 1, sr, sg, sb]);
    queue.push([x, y - 1, sr, sg, sb]);
  }
}

async function removeBackground(inputPath, tolerance) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  floodRemoveBackground(data, info.width, info.height, tolerance);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

function screenRectPx(screen, width, height) {
  return {
    left: Math.round((screen.x / 100) * width),
    top: Math.round((screen.y / 100) * height),
    width: Math.round((screen.w / 100) * width),
    height: Math.round((screen.h / 100) * height),
    radius: Math.round((screen.radius / 100) * Math.min(width, height)),
  };
}

async function punchScreenHole(image, screen) {
  const meta = await image.metadata();
  const rect = screenRectPx(screen, meta.width, meta.height);

  const holeSvg = `
    <svg width="${meta.width}" height="${meta.height}">
      <rect x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}" rx="${rect.radius}" ry="${rect.radius}" fill="black"/>
    </svg>`;

  return image.composite([
    {
      input: Buffer.from(holeSvg),
      blend: "dest-out",
    },
  ]);
}

const insets = {};

for (const [key, cfg] of Object.entries(SOURCES)) {
  const image = sharp(cfg.input).ensureAlpha();
  const punched = await punchScreenHole(image, cfg.screen);
  const outPath = join(outDir, cfg.output);
  await punched.toFile(outPath);

  const meta = await sharp(outPath).metadata();
  insets[key] = {
    viewBox: { w: meta.width, h: meta.height },
    screen: { x: cfg.screen.x, y: cfg.screen.y, w: cfg.screen.w, h: cfg.screen.h },
    ...(key === "macbook"
      ? { notch: cfg.notch }
      : { island: cfg.island }),
  };

  console.log(`Processed ${key}: ${meta.width}x${meta.height} -> ${cfg.output}`);
}

console.log(
  "Per-device PNGs processed. For device-insets.json, run: node scripts/process-composite-scene.mjs",
);
