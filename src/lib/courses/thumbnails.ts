import type { Instrument } from "@/lib/types";

/** Static seed/demo thumbnails committed under public/courses/. */
export const COURSE_THUMBNAIL_DIR = "/courses";

/** Admin uploads land under public/uploads/courses/ (gitignored). */
export const COURSE_UPLOAD_DIR = "/uploads/courses";

const INSTRUMENT_THEMES: Record<
  Instrument,
  { from: string; to: string; accent: string; label: string }
> = {
  Saham: { from: "#0b3d2e", to: "#14532d", accent: "#34d399", label: "Saham" },
  Crypto: { from: "#3d2208", to: "#78350f", accent: "#fbbf24", label: "Crypto" },
  Forex: { from: "#0c2d4a", to: "#164e63", accent: "#22d3ee", label: "Forex" },
};

export function defaultCourseThumbnailPath(slug: string): string {
  return `${COURSE_THUMBNAIL_DIR}/${slug}.svg`;
}

export function resolveCourseThumbnailUrl(course: {
  slug: string;
  thumbnailUrl?: string | null;
}): string {
  return course.thumbnailUrl?.trim() || defaultCourseThumbnailPath(course.slug);
}

export function getInstrumentTheme(instrument: Instrument) {
  return INSTRUMENT_THEMES[instrument];
}
