import type {
  ScoredCourse,
  ScoredGuidancePick,
  ScoredPlaylist,
} from "@/lib/learning/guidance/types";

/** Absolute minimum to appear in primary tier. */
const PRIMARY_ABSOLUTE_MIN = 42;
/** Primary tier: within this ratio of the top score. */
const PRIMARY_RATIO_OF_TOP = 0.72;
/** Absolute minimum for supporting tier. */
const SUPPORTING_ABSOLUTE_MIN = 30;
const PRIMARY_MAX = 5;
const SUPPORTING_MAX = 6;

export function courseToPick(entry: ScoredCourse): ScoredGuidancePick {
  return {
    kind: "course",
    score: entry.score,
    reasons: entry.reasons,
    course: entry.course,
  };
}

export function playlistToPick(entry: ScoredPlaylist): ScoredGuidancePick {
  return {
    kind: "playlist",
    score: entry.score,
    reasons: entry.reasons,
    playlist: entry.playlist,
  };
}

function pickKey(pick: ScoredGuidancePick): string {
  if (pick.kind === "course" && pick.course) return `course:${pick.course.slug}`;
  if (pick.kind === "playlist" && pick.playlist) return `playlist:${pick.playlist.slug}`;
  return `unknown:${pick.score}`;
}

export function mergeGuidancePicks(
  courses: ScoredCourse[],
  playlists: ScoredPlaylist[]
): ScoredGuidancePick[] {
  const merged = [...courses.map(courseToPick), ...playlists.map(playlistToPick)]
    .filter((pick) => pick.score > 0)
    .sort((a, b) => b.score - a.score || pickKey(a).localeCompare(pickKey(b)));

  const seen = new Set<string>();
  const deduped: ScoredGuidancePick[] = [];
  for (const pick of merged) {
    const key = pickKey(pick);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(pick);
  }
  return deduped;
}

export function splitGuidancePicks(all: ScoredGuidancePick[]): {
  primary: ScoredGuidancePick[];
  supporting: ScoredGuidancePick[];
} {
  if (all.length === 0) {
    return { primary: [], supporting: [] };
  }

  const topScore = all[0]!.score;
  const primaryThreshold = Math.max(PRIMARY_ABSOLUTE_MIN, Math.round(topScore * PRIMARY_RATIO_OF_TOP));

  const primary = all.filter((pick) => pick.score >= primaryThreshold).slice(0, PRIMARY_MAX);
  const primaryKeys = new Set(primary.map(pickKey));

  const supporting = all
    .filter(
      (pick) =>
        !primaryKeys.has(pickKey(pick)) &&
        pick.score >= SUPPORTING_ABSOLUTE_MIN &&
        pick.score < primaryThreshold
    )
    .slice(0, SUPPORTING_MAX);

  return { primary, supporting };
}
