export interface MentorTheme {
  /** CSS background (gradient) used as the card/thumbnail backdrop, standing in for a photo. */
  gradient: string;
  /** Soft highlight color layered behind the mentor cutout. */
  glow: string;
}

/**
 * One distinct backdrop per mentor slug — until real headshot photography exists,
 * this is the "photo" for course/mentor cards. Hue loosely echoes each mentor's
 * instrument/teaching style, but every mentor gets a unique combination so a row
 * of cards reads as distinct people at a glance (Masterclass-style density).
 */
const MENTOR_THEMES: Record<string, MentorTheme> = {
  "andra-wicaksono": {
    gradient: "linear-gradient(165deg, #0f2e27 0%, #1c4b3c 55%, #3d8163 100%)",
    glow: "#34d399",
  },
  "kirana-ayu": {
    gradient: "linear-gradient(165deg, #260f38 0%, #55206e 55%, #a855f7 100%)",
    glow: "#c084fc",
  },
  "fajar-nugroho": {
    gradient: "linear-gradient(165deg, #0b1f3d 0%, #1e3a6e 55%, #3b6fd1 100%)",
    glow: "#60a5fa",
  },
  "melati-putri": {
    gradient: "linear-gradient(165deg, #082a2e 0%, #0f4c52 55%, #17a2ac 100%)",
    glow: "#22d3ee",
  },
  "bimo-satrio": {
    gradient: "linear-gradient(165deg, #331008 0%, #6b2412 55%, #dd5f18 100%)",
    glow: "#fb923c",
  },
  "rangga-dewantara": {
    gradient: "linear-gradient(165deg, #2b230f 0%, #5c4a1a 55%, #c99a34 100%)",
    glow: "#fbbf24",
  },
};

const FALLBACK_PALETTE = Object.values(MENTOR_THEMES);

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic per-mentor backdrop theme; unrecognized slugs cycle the same palette instead of repeating one default. */
export function getMentorTheme(mentorSlug: string | undefined | null): MentorTheme {
  if (!mentorSlug) return FALLBACK_PALETTE[0];
  return (
    MENTOR_THEMES[mentorSlug] ??
    FALLBACK_PALETTE[hashSlug(mentorSlug) % FALLBACK_PALETTE.length]
  );
}
