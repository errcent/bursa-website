import assert from "node:assert/strict";
import test from "node:test";

import { mergeGuidancePicks, splitGuidancePicks } from "../src/lib/learning/guidance/picks";
import type { ScoredCourse, ScoredPlaylist } from "../src/lib/learning/guidance/types";
import type { Course } from "../src/lib/types";

function stubCourse(slug: string, score: number): ScoredCourse {
  const course = {
    slug,
    title: slug,
    mentorSlug: "m",
    instrument: "Crypto" as const,
    level: "Pemula" as const,
    price: 1,
    rating: 4,
    studentsCount: 1,
    durationHours: 4,
    shortDescription: "",
    outcomes: [],
    modules: [],
  } satisfies Course;
  return { course, score, reasons: ["ok"] };
}

function stubPlaylist(slug: string, score: number): ScoredPlaylist {
  return {
    playlist: {
      id: slug,
      slug,
      title: slug,
      description: null,
      itemCount: 3,
      totalMinutes: 30,
      mentorCount: 1,
      createdAt: "",
      updatedAt: "",
    },
    score,
    reasons: ["ok"],
  };
}

test("merge dedupes and sorts by score descending", () => {
  const merged = mergeGuidancePicks(
    [stubCourse("a", 50), stubCourse("b", 70)],
    [stubPlaylist("p1", 60)]
  );
  assert.equal(merged.length, 3);
  assert.equal(merged[0]?.kind, "course");
  assert.equal(merged[0]?.course?.slug, "b");
});

test("split returns empty tiers when no picks", () => {
  const split = splitGuidancePicks([]);
  assert.deepEqual(split, { primary: [], supporting: [] });
});

test("split puts only high scores in primary without backfill", () => {
  const merged = mergeGuidancePicks(
    [stubCourse("top", 90), stubCourse("mid", 55), stubCourse("low", 25)],
    []
  );
  const { primary, supporting } = splitGuidancePicks(merged);
  assert.ok(primary.length >= 1);
  assert.equal(primary[0]?.course?.slug, "top");
  assert.ok(primary.every((pick) => pick.score >= 42));
  assert.ok(!primary.some((pick) => pick.course?.slug === "low"));
  assert.ok(supporting.every((pick) => pick.score >= 30));
});
