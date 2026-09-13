import { slugToSeed } from "@/lib/thumbnails/ai-prompt-builder";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Deterministic SVG poster when static .webp is not on disk yet. */
export function buildThumbnailSvgPoster(title: string, slug: string): string {
  const seed = slugToSeed(slug);
  const hue = seed % 360;
  const hue2 = (hue + 42) % 360;
  const safeTitle = escapeXml(title);
  const lines =
    title.length > 48
      ? [title.slice(0, 32).trim(), title.slice(32, 64).trim()].filter(Boolean)
      : [title];

  const textLines = lines
    .map(
      (line, i) =>
        `<text x="640" y="${580 + i * 44}" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-family="system-ui,sans-serif" font-size="36" font-weight="600">${escapeXml(line)}</text>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue} 42% 22%);stop-opacity:1" />
      <stop offset="55%" style="stop-color:hsl(${hue2} 38% 14%);stop-opacity:1" />
      <stop offset="100%" style="stop-color:hsl(${hue} 30% 8%);stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow" cx="28%" cy="22%" r="65%">
      <stop offset="0%" style="stop-color:hsl(${hue2} 70% 55%);stop-opacity:0.35" />
      <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#glow)"/>
  <rect x="0" y="520" width="1280" height="200" fill="rgba(0,0,0,0.45)"/>
  ${textLines}
  <title>${safeTitle}</title>
</svg>`;
}
