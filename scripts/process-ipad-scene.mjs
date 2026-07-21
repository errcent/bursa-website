/**
 * Build photorealistic iPad scene PNG with transparent screen hole + insets JSON.
 * Run: node scripts/process-ipad-scene.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgInput = join(__dirname, "../public/mockups/sources/ipad-pro-frame.svg");
const outDir = join(__dirname, "../public/mockups");
mkdirSync(outDir, { recursive: true });

/** Screen hole — percent of rendered PNG (matches ipad-pro-frame.svg bezel) */
const IPAD = {
  screen: { x: 3.56, y: 4.27, w: 92.88, h: 91.46, radius: 1.75 },
};

function rectPx(box, width, height) {
  return {
    left: Math.round((box.x / 100) * width),
    top: Math.round((box.y / 100) * height),
    width: Math.round((box.w / 100) * width),
    height: Math.round((box.h / 100) * height),
    radius: Math.round((box.radius / 100) * Math.min(width, height)),
  };
}

async function punchScreenHole(image, screen) {
  const meta = await image.metadata();
  const rect = rectPx(screen, meta.width, meta.height);
  const holeSvg = `
    <svg width="${meta.width}" height="${meta.height}">
      <rect x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}" rx="${rect.radius}" ry="${rect.radius}" fill="black"/>
    </svg>`;
  return image.composite([{ input: Buffer.from(holeSvg), blend: "dest-out" }]);
}

const RENDER_WIDTH = 1462;

const base = sharp(svgInput).resize(RENDER_WIDTH).ensureAlpha();
const punched = await punchScreenHole(base, IPAD.screen);
const outPath = join(outDir, "ipad-pro-scene.png");
await punched.toFile(outPath);

const meta = await sharp(outPath).metadata();
const insets = {
  scene: {
    viewBox: { w: meta.width, h: meta.height },
    ipad: IPAD,
  },
};

const insetsJson = JSON.stringify(insets, null, 2);
writeFileSync(join(outDir, "device-insets.json"), insetsJson);
writeFileSync(join(__dirname, "../src/data/device-insets.json"), insetsJson);
console.log(`iPad scene: ${meta.width}x${meta.height} -> ipad-pro-scene.png`);
console.log(insetsJson);
