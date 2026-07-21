import type { Instrument, Level } from "@/lib/types";

export type ThumbnailKind = "course" | "playlist";

export type ThumbnailPromptInput = {
  kind: ThumbnailKind;
  slug: string;
  title: string;
  summary: string;
  instrument?: Instrument;
  level?: Level;
  /** Visual keywords derived from playlist theme or course outcomes. */
  visualKeywords: string[];
  /** Human-readable hint for where the card links (used in prompt context). */
  destinationLabel: string;
};

const INSTRUMENT_VISUALS: Record<Instrument, string> = {
  Saham:
    "Indonesian stock market, BEI trading screens, candlestick charts on dark monitors, equity research desk",
  Crypto:
    "blockchain network glow, digital asset charts, on-chain analytics dashboard, crypto trading workstation",
  Forex:
    "major currency pairs, global macro maps, forex terminal with EUR USD GBP JPY, economic calendar mood",
};

const LEVEL_MOOD: Record<Level, string> = {
  Pemula: "approachable, foundational, clean and inviting",
  Menengah: "focused, analytical, intermediate depth",
  Mahir: "advanced, sophisticated, institutional-grade detail",
};

const STYLE_SUFFIX =
  "Premium cinematic 16:10 thumbnail for dark fintech education platform. Photorealistic editorial photography, moody lighting with subtle lavender accent glow, shallow depth of field, no text, no logos, no watermarks, no readable UI labels, no human faces.";

export function buildAiThumbnailPrompt(input: ThumbnailPromptInput): string {
  const keywords = input.visualKeywords.filter(Boolean).slice(0, 6).join(", ");

  if (input.kind === "course") {
    const instrument = input.instrument ?? "Saham";
    const level = input.level ?? "Pemula";
    return [
      STYLE_SUFFIX,
      `Subject: online trading course titled "${input.title}".`,
      `Learning focus: ${input.summary}`,
      `Market: ${instrument}. Visual environment: ${INSTRUMENT_VISUALS[instrument]}.`,
      `Audience level: ${level} — tone should feel ${LEVEL_MOOD[level]}.`,
      `Key visual motifs: ${keywords}.`,
      `When clicked, user enters this specific class about ${input.destinationLabel}.`,
    ].join(" ");
  }

  return [
    STYLE_SUFFIX,
    `Subject: curated video playlist titled "${input.title}".`,
    `Collection theme: ${input.summary}`,
    `Key visual motifs: ${keywords}, stacked learning path, curated lesson series mood.`,
    `When clicked, user opens this playlist journey about ${input.destinationLabel}.`,
  ].join(" ");
}

export function slugToSeed(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash % 1_000_000;
}
