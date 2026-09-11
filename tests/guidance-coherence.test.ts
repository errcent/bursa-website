import assert from "node:assert/strict";
import test from "node:test";

import { evaluateCourseCoherence } from "../src/lib/learning/guidance/coherence";
import { analyzeProfile } from "../src/lib/learning/guidance/scoring";
import { resolveCourseTags } from "../src/lib/learning/guidance/tags";
import type { LearningGuidanceAnswers } from "../src/lib/learning/guidance/types";
import type { Course } from "../src/lib/types";

function baseAnswers(overrides: Partial<LearningGuidanceAnswers> = {}): LearningGuidanceAnswers {
  return {
    instrument: "Saham",
    experience: "never",
    tradingStyle: "scalping",
    goal: "side_income",
    riskTolerance: "aggressive",
    timeAvailability: "minimal",
    learningGap: "no_foundation",
    ...overrides,
  };
}

function stubCourse(overrides: Partial<Course> = {}): Course {
  return {
    slug: "scalping-saham-intraday-jam-perdagangan",
    title: "Scalping Saham IDX",
    mentorSlug: "dian-pratiwi",
    instrument: "Saham",
    level: "Pemula",
    price: 749000,
    rating: 4.7,
    studentsCount: 1000,
    durationHours: 4,
    shortDescription: "Scalping intraday",
    outcomes: [],
    modules: [],
    ...overrides,
  };
}

test("excludes advanced-tagged course for beginner basics goal", () => {
  const answers = baseAnswers({ goal: "basics", experience: "never", tradingStyle: "long_term" });
  const profile = analyzeProfile(answers);
  const course = stubCourse({
    slug: "unknown-advanced-course",
    level: "Mahir",
    durationHours: 10,
    title: "Strategi Lanjutan",
  });
  const tags = resolveCourseTags(course);
  const result = evaluateCourseCoherence(answers, profile, tags, course);
  assert.equal(result.excluded, true);
});

test("excludes long course for scalper with minimal time", () => {
  const answers = baseAnswers();
  const profile = analyzeProfile(answers);
  const course = stubCourse({ durationHours: 14, slug: "forex-makro-dasar", instrument: "Forex" });
  const tags = resolveCourseTags(course);
  const result = evaluateCourseCoherence(answers, profile, tags, course);
  assert.equal(result.excluded, true);
});

test("boosts risk-management course for emotional_control gap", () => {
  const answers = baseAnswers({
    goal: "side_income",
    riskTolerance: "aggressive",
    experience: "never",
    instrument: "Crypto",
    tradingStyle: "swing",
    learningGap: "emotional_control",
  });
  const profile = analyzeProfile(answers);
  const course = stubCourse({
    slug: "manajemen-risiko-crypto-pemula",
    instrument: "Crypto",
    durationHours: 4,
  });
  const tags = resolveCourseTags(course);
  const result = evaluateCourseCoherence(answers, profile, tags, course);
  assert.equal(result.excluded, false);
  assert.ok(result.bonus >= 10);
  assert.ok(
    result.reasons.some(
      (r) => r.includes("Fokus disiplin") || r.includes("Fondasi risiko")
    )
  );
});

test("compact-friendly scalping course passes coherence for minimal time", () => {
  const answers = baseAnswers({ tradingStyle: "scalping", timeAvailability: "minimal" });
  const profile = analyzeProfile(answers);
  const course = stubCourse();
  const tags = resolveCourseTags(course);
  const result = evaluateCourseCoherence(answers, profile, tags, course);
  assert.equal(result.excluded, false);
  assert.ok(result.multiplier >= 0.7);
});
