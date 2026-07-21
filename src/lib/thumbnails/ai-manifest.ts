import { courses } from "@/lib/mock-data";

import {
  buildAiThumbnailPrompt,
  slugToSeed,
  type ThumbnailKind,
} from "./ai-prompt-builder";
import { CURATED_PLAYLIST_META } from "./curated-playlist-meta";

export type ThumbnailManifestEntry = {
  kind: ThumbnailKind;
  slug: string;
  title: string;
  prompt: string;
  seed: number;
  destinationPath: string;
};

function courseVisualKeywords(
  instrument: string,
  level: string,
  outcomes: string[]
): string[] {
  const base = [instrument.toLowerCase(), level.toLowerCase(), "trading education"];
  const fromOutcomes = outcomes.slice(0, 3).map((o) => o.split(" ").slice(0, 4).join(" "));
  return [...base, ...fromOutcomes];
}

export const THUMBNAIL_MANIFEST: ThumbnailManifestEntry[] = [
  ...courses.map((course) => ({
    kind: "course" as const,
    slug: course.slug,
    title: course.title,
    prompt: buildAiThumbnailPrompt({
      kind: "course",
      slug: course.slug,
      title: course.title,
      summary: course.shortDescription,
      instrument: course.instrument,
      level: course.level,
      visualKeywords: courseVisualKeywords(
        course.instrument,
        course.level,
        course.outcomes
      ),
      destinationLabel: `${course.instrument} ${course.level} course`,
    }),
    seed: slugToSeed(course.slug),
    destinationPath: `/kelas/${course.slug}`,
  })),
  ...CURATED_PLAYLIST_META.map((playlist) => ({
    kind: "playlist" as const,
    slug: playlist.slug,
    title: playlist.title,
    prompt: buildAiThumbnailPrompt({
      kind: "playlist",
      slug: playlist.slug,
      title: playlist.title,
      summary: playlist.description,
      visualKeywords: [
        ...playlist.visualKeywords,
        ...playlist.instruments.map((i) => i.toLowerCase()),
      ],
      destinationLabel: playlist.destinationLabel,
    }),
    seed: slugToSeed(playlist.slug),
    destinationPath: `/playlist/${playlist.slug}`,
  })),
];

const manifestByKey = new Map(
  THUMBNAIL_MANIFEST.map((entry) => [`${entry.kind}:${entry.slug}`, entry] as const)
);

export function getThumbnailManifestEntry(
  kind: ThumbnailKind,
  slug: string
): ThumbnailManifestEntry | undefined {
  return manifestByKey.get(`${kind}:${slug}`);
}

export function getThumbnailPrompt(kind: ThumbnailKind, slug: string): string | undefined {
  return getThumbnailManifestEntry(kind, slug)?.prompt;
}
