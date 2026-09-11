import type { Course } from "@/lib/types";

import type { ProfileAnalysis } from "@/lib/learning/guidance/scoring";
import type { GuidanceContentTags } from "@/lib/learning/guidance/tags";
import { profileTimeBand } from "@/lib/learning/guidance/tags";
import type { LearningGuidanceAnswers } from "@/lib/learning/guidance/types";

export interface CoherenceAdjustment {
  excluded: boolean;
  multiplier: number;
  bonus: number;
  reasons: string[];
}

interface CoherenceRule {
  points: number;
  text: string;
}

function isBeginnerExperience(experience: LearningGuidanceAnswers["experience"]): boolean {
  return experience === "never" || experience === "demo";
}

/** Cross-dimension coherence: penalize contradictions, boost aligned picks. */
export function evaluateCourseCoherence(
  answers: LearningGuidanceAnswers,
  profile: ProfileAnalysis,
  tags: GuidanceContentTags,
  course: Course
): CoherenceAdjustment {
  const rules: CoherenceRule[] = [];
  let multiplier = 1;
  let excluded = false;

  const timeBand = profileTimeBand(answers.timeAvailability);
  const style = answers.tradingStyle;

  if (answers.goal === "basics" && tags.level === "advanced") {
    excluded = true;
  }

  if (isBeginnerExperience(answers.experience) && tags.level === "advanced") {
    excluded = true;
  }

  if (
    answers.riskTolerance === "aggressive" &&
    isBeginnerExperience(answers.experience) &&
    tags.level === "advanced"
  ) {
    excluded = true;
  }

  if (
    (style === "scalping" || style === "day_trading") &&
    answers.timeAvailability === "minimal" &&
    !tags.compactFriendly &&
    course.durationHours > 10
  ) {
    excluded = true;
  }

  if (excluded) {
    return { excluded: true, multiplier: 0, bonus: 0, reasons: [] };
  }

  if (!tags.styles.includes(style)) {
    multiplier *= 0.72;
  } else {
    rules.push({ points: 8, text: "Selaras gaya trading pilihanmu" });
  }

  if (!tags.goals.includes(answers.goal)) {
    multiplier *= 0.85;
  } else {
    rules.push({ points: 6, text: "Mendukung tujuan belajarmu" });
  }

  if (!tags.riskLevels.includes(answers.riskTolerance)) {
    if (answers.riskTolerance === "conservative" && tags.level === "advanced") {
      multiplier *= 0.55;
    } else {
      multiplier *= 0.8;
    }
  }

  if (!tags.timeBands.includes(timeBand)) {
    if (timeBand === "low" && !tags.compactFriendly) {
      multiplier *= 0.65;
      rules.push({ points: 0, text: "" });
    } else if (timeBand === "high" && !tags.deepFriendly) {
      multiplier *= 0.88;
    }
  } else if (timeBand === "low" && tags.compactFriendly) {
    rules.push({ points: 6, text: "Pas untuk waktu belajar terbatas" });
  } else if (timeBand === "high" && tags.deepFriendly) {
    rules.push({ points: 5, text: "Kedalaman materi untuk komitmen penuh" });
  }

  if (
    answers.riskTolerance === "conservative" &&
    isBeginnerExperience(answers.experience) &&
    (tags.psychology || tags.riskManagement)
  ) {
    rules.push({ points: 10, text: "Membangun disiplin sebelum naikkan risiko" });
  }

  if (
    answers.goal === "side_income" &&
    answers.riskTolerance === "aggressive" &&
    isBeginnerExperience(answers.experience) &&
    (tags.psychology || tags.riskManagement)
  ) {
    rules.push({ points: 12, text: "Fondasi risiko sebelum target penghasilan" });
  }

  if (
    answers.riskTolerance === "aggressive" &&
    !isBeginnerExperience(answers.experience) &&
    tags.level === "intermediate" &&
    style === answers.tradingStyle
  ) {
    rules.push({ points: 4, text: "" });
  }

  if (profile.pace === "compact" && course.durationHours > 18) {
    multiplier *= 0.7;
  }

  if (answers.goal === "retirement" && tags.goals.includes("retirement")) {
    rules.push({ points: 8, text: "Pendekatan stabil untuk tujuan jangka panjang" });
  }

  switch (answers.learningGap) {
    case "no_foundation":
      if (tags.level === "beginner") {
        rules.push({ points: 14, text: "Membangun fondasi dari nol" });
      } else if (tags.level === "advanced") {
        multiplier *= 0.5;
      }
      break;
    case "emotional_control":
      if (tags.psychology || tags.riskManagement) {
        rules.push({ points: 16, text: "Fokus disiplin & mindset dulu" });
      } else if (tags.level === "advanced" && isBeginnerExperience(answers.experience)) {
        multiplier *= 0.6;
      }
      break;
    case "inconsistent_execution":
      if (tags.level === "intermediate" || (tags.level === "beginner" && course.durationHours >= 4)) {
        rules.push({ points: 10, text: "Struktur praktis untuk konsistensi" });
      }
      break;
    case "ready_for_depth":
      if (answers.experience === "never" || answers.experience === "demo") {
        if (tags.level === "advanced") multiplier *= 0.55;
      } else if (tags.level !== "beginner") {
        rules.push({ points: 12, text: "Pendalaman untuk naik level" });
      }
      break;
  }

  const bonus = rules.reduce((sum, rule) => sum + rule.points, 0);
  const reasons = rules
    .filter((rule) => rule.text && rule.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((rule) => rule.text)
    .filter((text, index, arr) => arr.indexOf(text) === index)
    .slice(0, 2);

  return {
    excluded: false,
    multiplier: Math.max(0.45, Math.min(1, multiplier)),
    bonus,
    reasons,
  };
}

export function evaluatePlaylistCoherence(
  answers: LearningGuidanceAnswers,
  tags: GuidanceContentTags
): CoherenceAdjustment {
  const rules: CoherenceRule[] = [];
  let multiplier = 1;
  let excluded = false;

  const timeBand = profileTimeBand(answers.timeAvailability);
  const style = answers.tradingStyle;

  if (answers.goal === "basics" && tags.level === "advanced") {
    excluded = true;
  }

  if (isBeginnerExperience(answers.experience) && tags.level === "advanced") {
    excluded = true;
  }

  if (excluded) {
    return { excluded: true, multiplier: 0, bonus: 0, reasons: [] };
  }

  if (!tags.styles.includes(style)) {
    multiplier *= 0.78;
  }

  if (!tags.goals.includes(answers.goal)) {
    multiplier *= 0.86;
  }

  if (!tags.timeBands.includes(timeBand) && timeBand === "low" && !tags.compactFriendly) {
    multiplier *= 0.75;
  }

  if (
    answers.riskTolerance === "conservative" &&
    isBeginnerExperience(answers.experience) &&
    tags.psychology
  ) {
    rules.push({ points: 8, text: "Membangun mindset sebelum eksekusi" });
  }

  if (answers.learningGap === "emotional_control" && tags.psychology) {
    rules.push({ points: 14, text: "Kurasi psikologi & disiplin" });
  }
  if (answers.learningGap === "no_foundation" && tags.level === "beginner") {
    rules.push({ points: 10, text: "Jalur pemula terstruktur" });
  }

  const bonus = rules.reduce((sum, rule) => sum + rule.points, 0);
  return {
    excluded: false,
    multiplier: Math.max(0.5, Math.min(1, multiplier)),
    bonus,
    reasons: rules.filter((r) => r.text).map((r) => r.text).slice(0, 1),
  };
}
