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
      "calm trader workspace",
      "journal and mindfulness",
      "discipline rituals",
      "risk control",
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
      "financial statements",
      "fundamental analysis",
      "valuation basics",
      "Indonesian equities",
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
      "on-chain data",
      "wallet security",
      "crypto risk management",
      "beginner crypto path",
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
      "swing trading charts",
      "support resistance",
      "candlestick patterns",
      "position management",
    ],
    destinationLabel: "swing trading technical analysis",
  },
  {
    slug: "forex-dari-nol",
    title: "Forex dari Nol",
    description: "Memahami makro, suku bunga, dan reaksi pasar forex untuk pemula.",
    instruments: ["Forex"],
    visualKeywords: [
      "macro economics",
      "central bank rates",
      "forex beginner",
      "currency market narrative",
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
      "DCF model",
      "cash flow projection",
      "sector comparison",
      "advanced valuation",
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
      "stock screener",
      "quality fundamentals",
      "watchlist",
      "financial statement review",
    ],
    destinationLabel: "quality stock screening workflow",
  },
];
