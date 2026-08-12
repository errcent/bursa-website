import type { Instrument, Level } from "@/lib/types";

import {
  MASTERCLASS_PORTRAIT_COURSE_SLUGS,
  MASTERCLASS_PORTRAIT_PROMPTS,
  MASTERCLASS_PORTRAIT_SEEDS,
} from "./masterclass-prompts";

export type ThumbnailKind = "course" | "playlist";
export type ThumbnailStyle = "still-life" | "masterclass-portrait";

export type ThumbnailPromptInput = {
  kind: ThumbnailKind;
  slug: string;
  title: string;
  summary: string;
  instrument?: Instrument;
  level?: Level;
  visualKeywords: string[];
  destinationLabel: string;
};

/**
 * Style reference: Progress/benchmark (Bursa Nalar social feed).
 * Dark navy gradients, film grain, surreal editorial still life, soft accent light.
 */
const STILL_LIFE_SUFFIX =
  "Editorial still life product photograph, 16:9, deep navy charcoal gradient background, subtle film grain, soft window light, shallow depth of field, muted desaturated palette, generous negative space, inanimate objects only";

const INSTRUMENT_ACCENT: Record<Instrument, string> = {
  Saham: "soft peach and bronze accent light",
  Crypto: "electric blue and amber rim light on glass forms",
  Forex: "cool steel and brass accent highlights",
};

const COURSE_HERO_OBJECTS: Record<string, string> = {
  "fundamental-saham-untuk-pemula":
    "open vintage ledger book on dark marble surface",
  "membaca-laporan-keuangan-lanjutan":
    "stack of translucent glass sheets on charcoal desk",
  "swing-trading-teknikal-dasar":
    "curved brushed steel bow resting on navy velvet",
  "crypto-on-chain-dasar":
    "interlocking glass cubes with blue amber edge glow on black",
  "manajemen-risiko-crypto-pemula":
    "balanced stone scales with single controlled ember glow",
  "forex-makro-dasar":
    "antique brass compass on dark polished globe fragment",
  "screening-saham-dividen-konsisten":
    "polished gemstone under magnifying glass on charcoal",
  "price-action-swing-saham-menengah":
    "soft pink feather with water droplets floating in dark blue space",
  "siklus-bitcoin-halving-dan-makro-kripto":
    "glass orb containing subtle lunar phase spheres",
  "scalping-saham-intraday-jam-perdagangan":
    "macro precision watch gears on dark brushed metal",
  "eksekusi-scalping-order-book-idx":
    "layered translucent glass panes stacked in depth",
  "price-action-forex-tanpa-indikator":
    "minimal abstract bronze wave sculpture on navy gradient",
  "scalping-forex-sesi-london-ny":
    "two soft gold horizon lines reflected in dark still water",
  "defi-dan-tokenomics-pemula":
    "interconnected frosted glass rings linked on black background",
  "riset-narrative-kripto-menengah":
    "telescope lens reflecting distant nebula glow",
  "psikologi-trading-anti-fomo":
    "pink flamingo bird head sculpture in soft profile on deep navy",
  "blueprint-manajemen-risiko-trader":
    "rolled architectural blueprint with lavender side light",
};

const PLAYLIST_HERO_OBJECTS: Record<string, string> = {
  "kesehatan-mental-trading":
    "smooth meditation stone and closed journal on dark linen",
  "fundasi-analisis-saham":
    "bronze bull figurine reflection in dark polished sphere",
  "jalur-crypto-pemula":
    "small glowing glass seed inside protective glass dome",
  "teknikal-swing-trading":
    "bold periwinkle curved geometric pipe shape on grainy navy background",
  "forex-dari-nol":
    "brass compass and stacked vintage currency discs on navy velvet",
  "valuasi-lanjutan":
    "crystal prism splitting soft white light on dark marble",
  "screening-saham-berkualitas":
    "fine mesh sieve holding luminous pearls above charcoal surface",
};

function resolveHeroObject(input: ThumbnailPromptInput): string {
  const map = input.kind === "course" ? COURSE_HERO_OBJECTS : PLAYLIST_HERO_OBJECTS;
  return (
    map[input.slug] ??
    `abstract sculptural object symbolizing ${input.visualKeywords.slice(0, 3).join(", ")}`
  );
}

/** Short object-only prompt - avoids portrait bias from longer narrative prompts. */
export function getThumbnailStyle(kind: ThumbnailKind, slug: string): ThumbnailStyle {
  if (kind === "course" && MASTERCLASS_PORTRAIT_COURSE_SLUGS.has(slug)) {
    return "masterclass-portrait";
  }
  return "still-life";
}

export function buildAiThumbnailPrompt(input: ThumbnailPromptInput): string {
  if (input.kind === "course" && MASTERCLASS_PORTRAIT_PROMPTS[input.slug]) {
    return MASTERCLASS_PORTRAIT_PROMPTS[input.slug];
  }

  const heroObject = resolveHeroObject(input);
  const accent =
    input.instrument != null
      ? INSTRUMENT_ACCENT[input.instrument]
      : "soft lavender accent light";

  return `${heroObject}, ${accent}, ${STILL_LIFE_SUFFIX}`;
}

export function slugToSeed(slug: string): number {
  if (MASTERCLASS_PORTRAIT_SEEDS[slug] !== undefined) {
    return MASTERCLASS_PORTRAIT_SEEDS[slug];
  }

  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return (hash + 42_024) % 1_000_000;
}
