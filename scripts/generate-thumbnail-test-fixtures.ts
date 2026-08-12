/**
 * Local-only thumbnail aspect-ratio test fixtures.
 * Usage: npx tsx scripts/generate-thumbnail-test-fixtures.ts
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "thumbnails-test");

type Fixture = {
  filename: string;
  width: number;
  height: number;
  label: string;
  sublabel: string;
  bg: string;
};

const FIXTURES: Fixture[] = [
  {
    filename: "native-16x9.webp",
    width: 1280,
    height: 720,
    label: "NATIVE 16:9",
    sublabel: "1280 × 720",
    bg: "#1e3a5f",
  },
  {
    filename: "non-native-1x1.webp",
    width: 1280,
    height: 1280,
    label: "NON-NATIVE 1:1",
    sublabel: "1280 × 1280 → frame 16:9",
    bg: "#4a1942",
  },
];

function svgOverlay(fixture: Fixture): Buffer {
  const svg = `
<svg width="${fixture.width}" height="${fixture.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${fixture.bg}"/>
  <rect x="0" y="${Math.round(fixture.height * 0.42)}" width="100%" height="4" fill="rgba(255,255,255,0.35)"/>
  <rect x="0" y="${Math.round(fixture.height * 0.58)}" width="100%" height="4" fill="rgba(255,255,255,0.35)"/>
  <text x="50%" y="46%" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="${Math.round(fixture.width * 0.05)}" font-weight="700">${fixture.label}</text>
  <text x="50%" y="54%" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="Arial,sans-serif" font-size="${Math.round(fixture.width * 0.028)}">${fixture.sublabel}</text>
</svg>`;
  return Buffer.from(svg);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const fixture of FIXTURES) {
    const dest = path.join(OUT_DIR, fixture.filename);
    await sharp(svgOverlay(fixture)).webp({ quality: 90 }).toFile(dest);
    console.log(`✓ ${fixture.filename} (${fixture.width}×${fixture.height})`);
  }

  console.log(`\nFixtures written to public/thumbnails-test/`);
}

void main();
