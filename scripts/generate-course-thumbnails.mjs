/**
 * Generates static SVG course thumbnails under public/courses/.
 * Run: node scripts/generate-course-thumbnails.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "courses");

const themes = {
  Saham: { from: "#0b3d2e", to: "#14532d", accent: "#34d399" },
  Crypto: { from: "#3d2208", to: "#78350f", accent: "#fbbf24" },
  Forex: { from: "#0c2d4a", to: "#164e63", accent: "#22d3ee" },
};

const courses = [
  {
    slug: "fundamental-saham-untuk-pemula",
    title: "Fundamental Saham untuk Pemula",
    instrument: "Saham",
    level: "Pemula",
  },
  {
    slug: "membaca-laporan-keuangan-lanjutan",
    title: "Analisis Valuasi Lanjutan",
    instrument: "Saham",
    level: "Menengah",
  },
  {
    slug: "swing-trading-teknikal-dasar",
    title: "Swing Trading Saham",
    instrument: "Saham",
    level: "Pemula",
  },
  {
    slug: "crypto-on-chain-dasar",
    title: "Data On-Chain untuk Crypto",
    instrument: "Crypto",
    level: "Menengah",
  },
  {
    slug: "manajemen-risiko-crypto-pemula",
    title: "Manajemen Risiko Crypto",
    instrument: "Crypto",
    level: "Pemula",
  },
  {
    slug: "forex-makro-dasar",
    title: "Forex & Narasi Makro",
    instrument: "Forex",
    level: "Pemula",
  },
];

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(title, maxChars = 28) {
  const words = title.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function buildSvg({ slug, title, instrument, level }) {
  const theme = themes[instrument];
  const lines = wrapTitle(title);
  const titleY = lines.length === 1 ? 210 : lines.length === 2 ? 195 : 180;
  const titleLines = lines
    .map(
      (line, i) =>
        `<tspan x="48" dy="${i === 0 ? 0 : 34}" font-size="30" font-weight="600">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
    <radialGradient id="glow-${slug}" cx="25%" cy="15%" r="65%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="400" fill="url(#bg-${slug})"/>
  <rect width="640" height="400" fill="url(#glow-${slug})"/>
  <rect x="0" y="320" width="640" height="80" fill="#000000" fill-opacity="0.22"/>
  <text x="48" y="52" fill="${theme.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="13" font-weight="700" letter-spacing="0.14em">BURSA · ${escapeXml(instrument.toUpperCase())}</text>
  <text x="48" y="${titleY}" fill="#f8fafc" font-family="system-ui,Segoe UI,sans-serif">${titleLines}</text>
  <rect x="48" y="300" width="88" height="28" rx="14" fill="${theme.accent}" fill-opacity="0.18" stroke="${theme.accent}" stroke-opacity="0.45"/>
  <text x="92" y="319" text-anchor="middle" fill="${theme.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="12" font-weight="600">${escapeXml(level)}</text>
  <circle cx="560" cy="72" r="44" fill="${theme.accent}" fill-opacity="0.12"/>
  <circle cx="560" cy="72" r="28" fill="${theme.accent}" fill-opacity="0.2"/>
  <text x="560" y="80" text-anchor="middle" fill="${theme.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="22" font-weight="700">${escapeXml(instrument.slice(0, 1))}</text>
</svg>
`;
}

await mkdir(outDir, { recursive: true });

for (const course of courses) {
  const filePath = path.join(outDir, `${course.slug}.svg`);
  await writeFile(filePath, buildSvg(course), "utf8");
  console.log(`Wrote ${filePath}`);
}

console.log(`Generated ${courses.length} course thumbnails.`);
