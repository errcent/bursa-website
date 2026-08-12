import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const items = [
  {
    slug: "membaca-laporan-keuangan-lanjutan",
    url: process.env.THUMB_URL_1,
  },
  {
    slug: "forex-makro-dasar",
    url: process.env.THUMB_URL_2,
  },
  {
    slug: "scalping-saham-intraday-jam-perdagangan",
    url: process.env.THUMB_URL_3,
  },
  {
    slug: "defi-dan-tokenomics-pemula",
    url: process.env.THUMB_URL_4,
  },
  {
    slug: "siklus-bitcoin-halving-dan-makro-kripto",
    url: process.env.THUMB_URL_5,
  },
];

const outDir = path.join("public", "generated", "thumbnails", "course");
fs.mkdirSync(outDir, { recursive: true });

for (const item of items) {
  if (!item.url) throw new Error(`Missing URL for ${item.slug}`);
  const res = await fetch(item.url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${item.slug}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const dest = path.join(outDir, `${item.slug}.webp`);
  await sharp(buffer).webp({ quality: 90 }).toFile(dest);
  console.log(`saved ${dest}`);
}
