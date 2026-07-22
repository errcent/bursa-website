import { CourseLevel } from "@prisma/client";

import { levelToUi } from "@/lib/catalog/enums";
import { courseQualityScore } from "@/lib/catalog/ranking";
import type { LearningGuidanceAnswers } from "@/lib/learning/guidance/types";
import type { Course, Level, Mentor } from "@/lib/types";

const LEVEL_ORDER: CourseLevel[] = [CourseLevel.PEMULA, CourseLevel.MENENGAH, CourseLevel.MAHIR];

const LEVEL_INDEX: Record<Level, number> = {
  Pemula: 0,
  Menengah: 1,
  Mahir: 2,
};

export interface ProfileAnalysis {
  idealLevel: CourseLevel;
  idealLevelUi: Level;
  pace: "compact" | "balanced" | "deep";
  maxLevelIndex: number;
  minLevelIndex: number;
}

interface ScoredReason {
  points: number;
  text: string;
}

function uiLevelToCourseLevel(level: Level): CourseLevel {
  const map: Record<Level, CourseLevel> = {
    Pemula: CourseLevel.PEMULA,
    Menengah: CourseLevel.MENENGAH,
    Mahir: CourseLevel.MAHIR,
  };
  return map[level];
}

function experienceBaseIndex(experience: LearningGuidanceAnswers["experience"]): number {
  const map: Record<LearningGuidanceAnswers["experience"], number> = {
    never: 0,
    demo: 0,
    regular: 1,
    profitable: 2,
  };
  return map[experience];
}

/** Derives target level band from cross-signals (experience × goal × risk). */
export function analyzeProfile(answers: LearningGuidanceAnswers): ProfileAnalysis {
  let idealIndex = experienceBaseIndex(answers.experience);
  let minIndex = 0;
  let maxIndex = 2;

  if (answers.goal === "basics") {
    idealIndex = Math.min(idealIndex, 0);
    maxIndex = Math.min(maxIndex, 1);
  }

  if (answers.goal === "retirement") {
    idealIndex = Math.min(idealIndex, 1);
    maxIndex = Math.min(maxIndex, 1);
  }

  if (answers.goal === "side_income" && answers.experience !== "never") {
    idealIndex = Math.max(idealIndex, 1);
  }

  if (answers.goal === "wealth" && answers.experience === "profitable") {
    idealIndex = 2;
  }

  if (answers.riskTolerance === "conservative") {
    if (answers.experience === "never" || answers.experience === "demo") {
      idealIndex = 0;
      maxIndex = 0;
    } else if (answers.experience === "regular") {
      idealIndex = Math.min(idealIndex, 1);
      maxIndex = Math.min(maxIndex, 1);
    }
  }

  if (answers.riskTolerance === "aggressive" && answers.experience === "never") {
    idealIndex = 0;
    maxIndex = 0;
  }

  if (answers.riskTolerance === "aggressive" && answers.experience === "profitable") {
    idealIndex = Math.max(idealIndex, 1);
  }

  minIndex = Math.min(minIndex, idealIndex);
  maxIndex = Math.max(maxIndex, idealIndex);

  const pace: ProfileAnalysis["pace"] =
    answers.timeAvailability === "minimal"
      ? "compact"
      : answers.timeAvailability === "dedicated"
        ? "deep"
        : "balanced";

  const idealLevel = LEVEL_ORDER[idealIndex];
  return {
    idealLevel,
    idealLevelUi: levelToUi(idealLevel),
    pace,
    maxLevelIndex: maxIndex,
    minLevelIndex: minIndex,
  };
}

function lessonCount(course: Course): number {
  if (course.lessonCount != null) return course.lessonCount;
  return course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
}

function scoreLevelFit(
  profile: ProfileAnalysis,
  courseLevel: CourseLevel,
  courseLevelUi: Level,
  experience: LearningGuidanceAnswers["experience"]
): ScoredReason {
  const courseIndex = LEVEL_INDEX[courseLevelUi];
  const idealIndex = LEVEL_ORDER.indexOf(profile.idealLevel);
  const gap = Math.abs(courseIndex - idealIndex);

  if (courseIndex < profile.minLevelIndex || courseIndex > profile.maxLevelIndex) {
    return { points: -20, text: "" };
  }

  if (gap === 0) {
    return { points: 35, text: `Level ${courseLevelUi} selaras dengan profilmu` };
  }

  if (gap === 1) {
    if (courseIndex > idealIndex) {
      if (experience === "never" || experience === "demo") {
        return { points: 6, text: "Satu tingkat di atas — selesaikan fondasi dulu" };
      }
      return { points: 22, text: "Langkah lanjutan setelah fondasi kuat" };
    }
    return { points: 16, text: "Cocok untuk menguatkan fondasi" };
  }

  return { points: -12, text: "" };
}

function scoreGoalFit(
  answers: LearningGuidanceAnswers,
  courseLevelUi: Level
): ScoredReason {
  const idx = LEVEL_INDEX[courseLevelUi];

  if (answers.goal === "basics" && idx === 0) {
    return { points: 18, text: "Fokus membangun dasar yang solid" };
  }
  if (answers.goal === "side_income" && idx === 1) {
    return { points: 14, text: "Praktis untuk penghasilan sampingan" };
  }
  if (answers.goal === "wealth" && idx >= 1) {
    return { points: 12, text: "Mendukung akumulasi jangka menengah" };
  }
  if (answers.goal === "retirement" && idx <= 1 && answers.riskTolerance === "conservative") {
    return { points: 14, text: "Pendekatan stabil untuk tujuan jangka panjang" };
  }
  if (answers.goal === "basics" && idx === 1) {
    return { points: 6, text: "Masih relevan setelah paham dasar" };
  }

  return { points: 0, text: "" };
}

function scoreStyleAndPace(
  answers: LearningGuidanceAnswers,
  profile: ProfileAnalysis,
  course: Course
): ScoredReason[] {
  const results: ScoredReason[] = [];
  const hours = course.durationHours;
  const lessons = lessonCount(course);

  const styleDuration: Record<
    LearningGuidanceAnswers["tradingStyle"],
    { min: number; max: number; label: string }
  > = {
    scalping: { min: 3, max: 12, label: "ritme aktif scalping" },
    day_trading: { min: 4, max: 16, label: "ritme day trading" },
    swing: { min: 5, max: 20, label: "swing trading" },
    long_term: { min: 6, max: 30, label: "strategi jangka panjang" },
  };

  const band = styleDuration[answers.tradingStyle];
  if (hours >= band.min && hours <= band.max) {
    results.push({ points: 10, text: `Durasi selaras dengan ${band.label}` });
  } else if (hours < band.min) {
    results.push({ points: 3, text: "Materi ringkas — cocok sebagai intro" });
  } else {
    results.push({ points: 4, text: "Materi lebih mendalam untuk gaya tradingmu" });
  }

  if (profile.pace === "compact") {
    if (hours <= 8 && lessons <= 24) {
      results.push({ points: 8, text: "Ringkas untuk waktu terbatas" });
    } else if (hours > 15) {
      results.push({ points: -6, text: "" });
    }
  } else if (profile.pace === "deep") {
    if (hours >= 5 && lessons >= 8) {
      results.push({ points: 8, text: "Kedalaman materi untuk komitmen penuh" });
    }
  } else if (hours >= 4 && hours <= 18) {
    results.push({ points: 6, text: "Durasi seimbang untuk belajar rutin" });
  }

  if (answers.instrument === "Crypto" && (answers.tradingStyle === "scalping" || answers.tradingStyle === "day_trading")) {
    results.push({ points: 4, text: "Pasar 24/7 mendukung gaya aktif" });
  }
  if (answers.instrument === "Saham" && answers.tradingStyle === "long_term") {
    results.push({ points: 4, text: "Saham cocok untuk horizon jangka panjang" });
  }
  if (answers.instrument === "Forex" && answers.riskTolerance === "conservative" && course.level !== "Mahir") {
    results.push({ points: 4, text: "Fondasi disiplin risiko untuk Forex" });
  }

  return results;
}

function scoreRiskCapital(
  answers: LearningGuidanceAnswers,
  courseLevelUi: Level
): ScoredReason[] {
  const results: ScoredReason[] = [];
  const idx = LEVEL_INDEX[courseLevelUi];

  if (answers.riskTolerance === "conservative") {
    if (idx === 0) results.push({ points: 10, text: "Pendekatan stabil untuk profil konservatif" });
    else if (idx === 1) results.push({ points: 5, text: "" });
    else results.push({ points: -8, text: "" });
  } else if (answers.riskTolerance === "moderate") {
    if (idx === 1) results.push({ points: 8, text: "Level seimbang untuk risiko moderat" });
    else if (idx === 0 || idx === 2) results.push({ points: 4, text: "" });
  } else if (answers.riskTolerance === "aggressive") {
    if (idx === 2) results.push({ points: 10, text: "Mendalami strategi lanjutan" });
    else if (idx === 1) results.push({ points: 6, text: "" });
    else if (answers.experience === "never") {
      results.push({ points: -10, text: "" });
    } else {
      results.push({ points: 2, text: "Bangun fondasi sebelum naikkan risiko" });
    }
  }

  const capital = answers.capitalRange;
  if (!capital || capital === "prefer_not_say") return results;

  if (capital === "under_5m") {
    if (idx === 0) results.push({ points: 8, text: "Cocok untuk modal belajar kecil" });
    else if (idx === 2) results.push({ points: -6, text: "" });
  } else if (capital === "above_50m") {
    if (idx >= 1) results.push({ points: 6, text: "Fokus manajemen risiko untuk modal besar" });
  }

  if (
    answers.riskTolerance === "aggressive" &&
    capital === "under_5m" &&
    idx === 2
  ) {
    results.push({ points: -8, text: "" });
  }

  return results;
}

function scoreFormatPreference(
  answers: LearningGuidanceAnswers,
  course: Course,
  mentor: Mentor | undefined
): ScoredReason {
  const format = answers.learningFormat ?? "mixed";

  if (format === "live" && mentor?.availableFor1on1) {
    return { points: 8, text: "Mentor tersedia untuk sesi 1-on-1" };
  }
  if (format === "community" && course.studentsCount >= 30) {
    return { points: 6, text: "Komunitas belajar yang aktif" };
  }
  if (format === "video") {
    return { points: 4, text: "Belajar mandiri dengan video terstruktur" };
  }
  if (format === "mixed") {
    return { points: 5, text: "Format fleksibel — video, live, dan komunitas" };
  }
  return { points: 0, text: "" };
}

function topReasons(items: ScoredReason[], limit = 3): string[] {
  return items
    .filter((item) => item.text && item.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((item) => item.text)
    .filter((text, index, arr) => arr.indexOf(text) === index)
    .slice(0, limit);
}

export function scoreCourseForGuidance(
  course: Course,
  answers: LearningGuidanceAnswers,
  profile: ProfileAnalysis,
  mentor: Mentor | undefined
): { score: number; reasons: string[] } {
  if (course.instrument !== answers.instrument) {
    return { score: 0, reasons: [] };
  }

  const courseLevel = uiLevelToCourseLevel(course.level);
  const buckets: ScoredReason[] = [];

  buckets.push({ points: 12, text: `Fokus ${answers.instrument}` });
  buckets.push(scoreLevelFit(profile, courseLevel, course.level, answers.experience));
  buckets.push(scoreGoalFit(answers, course.level));
  buckets.push(...scoreStyleAndPace(answers, profile, course));
  buckets.push(...scoreRiskCapital(answers, course.level));
  buckets.push(scoreFormatPreference(answers, course, mentor));

  const qualityPoints = Math.round(courseQualityScore(course, mentor) * 12);
  if (qualityPoints >= 6) {
    buckets.push({ points: qualityPoints, text: "Kualitas kelas dan mentor terpercaya" });
  } else if (qualityPoints > 0) {
    buckets.push({ points: qualityPoints, text: "" });
  }

  if (
    (answers.experience === "never" || answers.experience === "demo") &&
    course.level === "Mahir"
  ) {
    buckets.push({ points: -25, text: "" });
  }

  if (answers.goal === "basics" && course.level === "Mahir") {
    buckets.push({ points: -15, text: "" });
  }

  const score = buckets.reduce((sum, item) => sum + item.points, 0);
  return { score, reasons: topReasons(buckets) };
}

export function scoreMentorForGuidance(
  mentor: Mentor,
  answers: LearningGuidanceAnswers,
  courseScores: { course: Course; score: number }[]
): { score: number; reasons: string[] } {
  if (!mentor.instruments.includes(answers.instrument)) {
    return { score: 0, reasons: [] };
  }

  const buckets: ScoredReason[] = [{ points: 20, text: `Spesialis ${answers.instrument}` }];

  const mentorCourseScores = courseScores
    .filter((entry) => entry.course.mentorSlug === mentor.slug && entry.score > 0)
    .map((entry) => entry.score);

  const avgCourseScore =
    mentorCourseScores.length > 0
      ? mentorCourseScores.reduce((sum, s) => sum + s, 0) / mentorCourseScores.length
      : 0;

  if (avgCourseScore >= 50) {
    buckets.push({
      points: Math.round(avgCourseScore * 0.25),
      text: "Kelas mereka cocok dengan profil belajarmu",
    });
  }

  if (answers.experience === "profitable" && mentor.yearsExperience >= 8) {
    buckets.push({ points: 12, text: "Pengalaman mendalam untuk trader lanjutan" });
  }
  if (
    (answers.experience === "never" || answers.experience === "demo") &&
    mentor.yearsExperience >= 3 &&
    mentor.yearsExperience <= 12
  ) {
    buckets.push({ points: 10, text: "Terbiasa membimbing pemula" });
  }
  if (answers.experience === "regular" && mentor.yearsExperience >= 5) {
    buckets.push({ points: 8, text: "Mentor dengan rekam jejak mengajar solid" });
  }

  if (answers.riskTolerance === "conservative" && mentor.yearsExperience >= 5) {
    buckets.push({ points: 6, text: "Menekankan disiplin risiko" });
  }

  if (answers.learningFormat === "live" && mentor.availableFor1on1) {
    buckets.push({ points: 10, text: "Buka sesi live 1-on-1" });
  }

  const ratingPoints = Math.min(Math.round(mentor.rating * 2.5), 12);
  if (ratingPoints > 0) {
    buckets.push({ points: ratingPoints, text: "" });
  }

  if (mentor.verified) {
    buckets.push({ points: 8, text: "Mentor terverifikasi" });
  }

  const score = buckets.reduce((sum, item) => sum + item.points, 0);
  return { score, reasons: topReasons(buckets) };
}

const MIN_COURSE_SCORE = 38;

/** Picks top courses with mentor/level diversity when scores are close. */
export function selectCourseRecommendations(
  scored: { course: Course; score: number; reasons: string[] }[],
  limit = 4
): { course: Course; score: number; reasons: string[] }[] {
  const eligible = scored
    .filter((entry) => entry.score >= MIN_COURSE_SCORE)
    .sort((a, b) => b.score - a.score);

  const pool = eligible.length >= 2 ? eligible : scored.sort((a, b) => b.score - a.score);

  const picked: typeof pool = [];
  const mentorCounts = new Map<string, number>();

  for (const entry of pool) {
    if (picked.length >= limit) break;
    const mentorCount = mentorCounts.get(entry.course.mentorSlug) ?? 0;
    if (mentorCount >= 2 && picked.length < limit - 1) continue;
    picked.push(entry);
    mentorCounts.set(entry.course.mentorSlug, mentorCount + 1);
  }

  if (picked.length < limit) {
    for (const entry of pool) {
      if (picked.some((p) => p.course.slug === entry.course.slug)) continue;
      picked.push(entry);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

export function selectMentorRecommendations(
  scored: { mentor: Mentor; score: number; reasons: string[] }[],
  topCourseMentorSlugs: Set<string>,
  limit = 3
): { mentor: Mentor; score: number; reasons: string[] }[] {
  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      const aLinked = topCourseMentorSlugs.has(a.mentor.slug) ? 1 : 0;
      const bLinked = topCourseMentorSlugs.has(b.mentor.slug) ? 1 : 0;
      if (bLinked !== aLinked) return bLinked - aLinked;
      return b.score - a.score;
    })
    .slice(0, limit);
}
