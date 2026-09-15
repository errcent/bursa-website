import type { NoteBeliefTag } from "@/lib/note/cognition/types";

const RULES: { tag: NoteBeliefTag; patterns: RegExp[] }[] = [
  {
    tag: "trade_idea",
    patterns: [
      /\b(long|short|buy|sell|entry|exit|tp|sl|take profit|stop loss)\b/i,
      /\b(idea trade|rencana entry|mau entry|will enter)\b/i,
    ],
  },
  {
    tag: "setup_hypothesis",
    patterns: [
      /\b(setup|breakout|pullback|retest|support|resistance|pattern|struktur|structure)\b/i,
      /\b(hypothesis|hipotesis|if.*then|kalau.*maka)\b/i,
    ],
  },
  {
    tag: "macro_news",
    patterns: [
      /\b(cpi|nfp|fomc|fed|rate|inflasi|inflation|gdp|employment|jobless|ecb|boj)\b/i,
      /\b(news|berita|kalender|macro|makro|data)\b/i,
    ],
  },
  {
    tag: "emotion_psych",
    patterns: [
      /\b(fomo|revenge|takut|fear|greed|serak|marah|cemas|tenang|tilt|impulsive|impulsif)\b/i,
      /\b(feel|feeling|emosi|psychology|psikologi|mindset)\b/i,
    ],
  },
  {
    tag: "market_observation",
    patterns: [
      /\b(market|pasar|price|harga|volume|trend|range|volatil|liquidity|likuiditas)\b/i,
      /\b(observe|observ|perhatikan|lihat.*chart)\b/i,
    ],
  },
];

export function classifyNoteText(text: string): NoteBeliefTag[] {
  const t = text.trim();
  if (!t) return [];
  const hits = new Set<NoteBeliefTag>();
  for (const { tag, patterns } of RULES) {
    if (patterns.some((p) => p.test(t))) hits.add(tag);
  }
  if (!hits.size) hits.add("market_observation");
  return [...hits];
}

export function tagLabel(tag: NoteBeliefTag, locale: "id" | "en"): string {
  const map: Record<NoteBeliefTag, Record<"id" | "en", string>> = {
    trade_idea: { id: "Trade idea", en: "Trade idea" },
    market_observation: { id: "Observasi pasar", en: "Market observation" },
    emotion_psych: { id: "Emosi / psikologi", en: "Emotion / psychology" },
    macro_news: { id: "Makro / news", en: "Macro / news" },
    setup_hypothesis: { id: "Hipotesis setup", en: "Setup hypothesis" },
  };
  return map[tag][locale];
}
