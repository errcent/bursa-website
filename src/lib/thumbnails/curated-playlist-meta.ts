import type { Instrument } from "@/lib/types";

/** Metadata for curated playlists (seed + thumbnail prompts). */
export type CuratedPlaylistMeta = {
  slug: string;
  title: string;
  description: string;
  instruments: Instrument[];
  visualKeywords: string[];
  destinationLabel: string;
};

export const CURATED_PLAYLIST_META: CuratedPlaylistMeta[] = [
  {
    slug: "kesehatan-mental-trading",
    title: "Kesehatan Mental Trading",
    description:
      "Kurasi video psikologi, disiplin, dan mindset dari lima mentor berbeda.",
    instruments: ["Saham", "Forex", "Crypto"],
    visualKeywords: [
      "calm still life",
      "mindful discipline",
      "emotional balance",
      "mental clarity",
    ],
    destinationLabel: "trading psychology and emotional discipline",
  },
  {
    slug: "fundasi-analisis-saham",
    title: "Fundasi Analisis Saham",
    description: "Tiga video pembuka untuk memahami fundamental dan valuasi.",
    instruments: ["Saham"],
    visualKeywords: [
      "foundation metaphor",
      "equity still life",
      "fundamental depth",
      "quality investing",
    ],
    destinationLabel: "stock fundamental analysis foundations",
  },
  {
    slug: "jalur-crypto-pemula",
    title: "Jalur Crypto Pemula",
    description:
      "Mulai dari on-chain dasar hingga manajemen risiko untuk trader crypto baru.",
    instruments: ["Crypto"],
    visualKeywords: [
      "glass seed metaphor",
      "beginner path",
      "protected growth",
      "on-chain glow",
    ],
    destinationLabel: "beginner crypto trading path",
  },
  {
    slug: "teknikal-swing-trading",
    title: "Teknikal Swing Trading",
    description:
      "Rangkaian video candlestick, support/resistance, dan manajemen posisi untuk swing trader.",
    instruments: ["Saham"],
    visualKeywords: [
      "abstract curved path",
      "swing rhythm",
      "geometric flow",
      "technical focus",
    ],
    destinationLabel: "swing trading technical analysis",
  },
  {
    slug: "forex-dari-nol",
    title: "Forex dari Nol",
    description: "Memahami makro, suku bunga, dan reaksi pasar forex untuk pemula.",
    instruments: ["Forex"],
    visualKeywords: [
      "compass metaphor",
      "macro navigation",
      "currency brass",
      "global orientation",
    ],
    destinationLabel: "forex macro fundamentals for beginners",
  },
  {
    slug: "valuasi-lanjutan",
    title: "Valuasi Lanjutan",
    description:
      "DCF, proyeksi arus kas, dan perbandingan sektor untuk analis yang ingin naik level.",
    instruments: ["Saham"],
    visualKeywords: [
      "prism light split",
      "valuation depth",
      "advanced analysis",
      "refined precision",
    ],
    destinationLabel: "advanced equity valuation methods",
  },
  {
    slug: "screening-saham-berkualitas",
    title: "Screening Saham Berkualitas",
    description:
      "Dari membaca laporan keuangan hingga menyusun watchlist emiten berkualitas.",
    instruments: ["Saham"],
    visualKeywords: [
      "pearl sieve metaphor",
      "quality selection",
      "curated gems",
      "filtering light",
    ],
    destinationLabel: "quality stock screening workflow",
  },
];
