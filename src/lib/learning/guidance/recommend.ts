import {
  CourseLevel,
  Instrument,
  LearningCapitalRange,
  LearningFormat,
  LearningGoal,
  LearningRiskTolerance,
  LearningTimeAvailability,
  LearningTradingStyle,
} from "@prisma/client";
import type { LearningExperience } from "@prisma/client";

import { instrumentFromUi, instrumentToUi, levelToUi } from "@/lib/admin/server";
import { courseQualityScore } from "@/lib/catalog/ranking";
import { getCatalogCourses, getCatalogMentors } from "@/lib/catalog/server";
import type {
  LearningGuidanceAnswers,
  LearningGuidanceProfileRecord,
  LearningGuidanceResult,
  ScoredCourse,
  ScoredMentor,
} from "@/lib/learning/guidance/types";
import type { Course, Level, Mentor } from "@/lib/types";

const LEVEL_ORDER: CourseLevel[] = [CourseLevel.PEMULA, CourseLevel.MENENGAH, CourseLevel.MAHIR];

const QUALITY_TIEBREAKER_MAX = 12;

/** Prisma enum values as literals — safe before `prisma generate` refreshes runtime exports. */
const EXPERIENCE_TIER = {
  NEVER: "NEVER",
  DEMO: "DEMO",
  REGULAR: "REGULAR",
  PROFITABLE: "PROFITABLE",
} as const satisfies Record<string, LearningExperience>;

function uiLevelToCourseLevel(level: Level): CourseLevel {
  const map: Record<Level, CourseLevel> = {
    Pemula: CourseLevel.PEMULA,
    Menengah: CourseLevel.MENENGAH,
    Mahir: CourseLevel.MAHIR,
  };
  return map[level];
}

function experienceToLevel(experience: LearningGuidanceAnswers["experience"]): CourseLevel {
  const map: Record<LearningGuidanceAnswers["experience"], CourseLevel> = {
    never: CourseLevel.PEMULA,
    demo: CourseLevel.PEMULA,
    regular: CourseLevel.MENENGAH,
    profitable: CourseLevel.MAHIR,
  };
  return map[experience];
}

function experienceToTier(experience: LearningGuidanceAnswers["experience"]): LearningExperience {
  const map: Record<LearningGuidanceAnswers["experience"], LearningExperience> = {
    never: EXPERIENCE_TIER.NEVER,
    demo: EXPERIENCE_TIER.DEMO,
    regular: EXPERIENCE_TIER.REGULAR,
    profitable: EXPERIENCE_TIER.PROFITABLE,
  };
  return map[experience];
}

function tierToExperience(tier: LearningExperience): LearningGuidanceAnswers["experience"] {
  const map: Record<LearningExperience, LearningGuidanceAnswers["experience"]> = {
    [EXPERIENCE_TIER.NEVER]: "never",
    [EXPERIENCE_TIER.DEMO]: "demo",
    [EXPERIENCE_TIER.REGULAR]: "regular",
    [EXPERIENCE_TIER.PROFITABLE]: "profitable",
  };
  return map[tier];
}

function tradingStyleToDb(style: LearningGuidanceAnswers["tradingStyle"]): LearningTradingStyle {
  const map: Record<LearningGuidanceAnswers["tradingStyle"], LearningTradingStyle> = {
    scalping: LearningTradingStyle.SCALPING,
    swing: LearningTradingStyle.SWING,
    long_term: LearningTradingStyle.LONG_TERM,
  };
  return map[style];
}

function goalToDb(goal: LearningGuidanceAnswers["goal"]): LearningGoal {
  const map: Record<LearningGuidanceAnswers["goal"], LearningGoal> = {
    side_income: LearningGoal.SIDE_INCOME,
    wealth: LearningGoal.WEALTH_BUILDING,
    basics: LearningGoal.LEARN_BASICS,
    retirement: LearningGoal.RETIREMENT,
  };
  return map[goal];
}

function riskToDb(risk: LearningGuidanceAnswers["riskTolerance"]): LearningRiskTolerance {
  const map: Record<LearningGuidanceAnswers["riskTolerance"], LearningRiskTolerance> = {
    conservative: LearningRiskTolerance.CONSERVATIVE,
    moderate: LearningRiskTolerance.MODERATE,
    aggressive: LearningRiskTolerance.AGGRESSIVE,
  };
  return map[risk];
}

function timeToDb(time: LearningGuidanceAnswers["timeAvailability"]): LearningTimeAvailability {
  const map: Record<LearningGuidanceAnswers["timeAvailability"], LearningTimeAvailability> = {
    minimal: LearningTimeAvailability.MINIMAL,
    part_time: LearningTimeAvailability.PART_TIME,
    dedicated: LearningTimeAvailability.DEDICATED,
  };
  return map[time];
}

function capitalToDb(
  capital: LearningGuidanceAnswers["capitalRange"] | undefined
): LearningCapitalRange | null {
  if (!capital || capital === "prefer_not_say") return null;
  const map: Record<
    Exclude<NonNullable<LearningGuidanceAnswers["capitalRange"]>, "prefer_not_say">,
    LearningCapitalRange
  > = {
    under_5m: LearningCapitalRange.UNDER_5M,
    "5_20m": LearningCapitalRange.FROM_5M_TO_20M,
    "20_50m": LearningCapitalRange.FROM_20M_TO_50M,
    above_50m: LearningCapitalRange.ABOVE_50M,
  };
  return map[capital];
}

function formatToDb(format: LearningGuidanceAnswers["learningFormat"]): LearningFormat {
  const map: Record<LearningGuidanceAnswers["learningFormat"], LearningFormat> = {
    video: LearningFormat.VIDEO,
    live: LearningFormat.LIVE,
    community: LearningFormat.COMMUNITY,
    mixed: LearningFormat.MIXED,
  };
  return map[format];
}

export function answersToProfileData(answers: LearningGuidanceAnswers) {
  return {
    instrument: instrumentFromUi(answers.instrument),
    experienceLevel: experienceToLevel(answers.experience),
    experienceTier: experienceToTier(answers.experience),
    tradingStyle: tradingStyleToDb(answers.tradingStyle),
    goal: goalToDb(answers.goal),
    riskTolerance: riskToDb(answers.riskTolerance),
    timeAvailability: timeToDb(answers.timeAvailability),
    capitalRange: capitalToDb(answers.capitalRange),
    learningFormat: formatToDb(answers.learningFormat),
  };
}

export function serializeProfileRecord(
  profile: {
    instrument: Instrument;
    experienceLevel: CourseLevel;
    experienceTier: LearningExperience;
    tradingStyle: LearningTradingStyle;
    goal: LearningGoal;
    riskTolerance: LearningRiskTolerance;
    timeAvailability: LearningTimeAvailability;
    capitalRange: LearningCapitalRange | null;
    learningFormat: LearningFormat;
    completedAt: Date;
  }
): LearningGuidanceProfileRecord {
  return {
    instrument: profile.instrument,
    experienceLevel: profile.experienceLevel,
    experienceTier: profile.experienceTier,
    tradingStyle: profile.tradingStyle,
    goal: profile.goal,
    riskTolerance: profile.riskTolerance,
    timeAvailability: profile.timeAvailability,
    capitalRange: profile.capitalRange,
    learningFormat: profile.learningFormat,
    completedAt: profile.completedAt.toISOString(),
  };
}

function levelDistance(a: CourseLevel, b: CourseLevel): number {
  return Math.abs(LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

function qualityTiebreaker(course: Course, mentor: Mentor | undefined): number {
  return courseQualityScore(course, mentor) * QUALITY_TIEBREAKER_MAX;
}

function scoreCapitalFit(
  answers: LearningGuidanceAnswers,
  courseLevel: CourseLevel,
  reasons: string[]
): number {
  const capital = answers.capitalRange;
  if (!capital || capital === "prefer_not_say") return 0;

  if (capital === "under_5m") {
    if (courseLevel === CourseLevel.PEMULA) {
      reasons.push("Cocok untuk modal belajar kecil");
      return 10;
    }
    if (courseLevel === CourseLevel.MENENGAH) return 3;
    return -6;
  }

  if (capital === "5_20m") {
    if (courseLevel === CourseLevel.PEMULA || courseLevel === CourseLevel.MENENGAH) {
      reasons.push("Selaras dengan modal pemula–menengah");
      return 6;
    }
    return 2;
  }

  if (capital === "20_50m") {
    if (courseLevel === CourseLevel.MENENGAH) {
      reasons.push("Level menengah untuk modal yang lebih fleksibel");
      return 8;
    }
    return 4;
  }

  if (capital === "above_50m") {
    if (courseLevel !== CourseLevel.PEMULA) {
      reasons.push("Fokus manajemen risiko untuk modal signifikan");
      return 8;
    }
    return 2;
  }

  return 0;
}

function scoreRiskFit(
  answers: LearningGuidanceAnswers,
  courseLevel: CourseLevel,
  reasons: string[]
): number {
  let score = 0;

  if (answers.riskTolerance === "conservative") {
    if (courseLevel === CourseLevel.PEMULA) {
      score += 12;
      reasons.push("Pendekatan stabil untuk profil konservatif");
    } else if (courseLevel === CourseLevel.MENENGAH) {
      score += 6;
    } else {
      score -= 10;
    }
    if (answers.instrument === "Forex") {
      reasons.push("Perhatikan leverage — mulai posisi sangat kecil");
    }
  } else if (answers.riskTolerance === "moderate") {
    if (courseLevel === CourseLevel.MENENGAH) {
      score += 8;
      reasons.push("Level seimbang untuk risiko moderat");
    } else if (levelDistance(courseLevel, CourseLevel.MENENGAH) === 1) {
      score += 4;
    }
  } else if (answers.riskTolerance === "aggressive") {
    if (courseLevel === CourseLevel.MAHIR) {
      score += 10;
      reasons.push("Mendalami strategi lanjutan");
    } else if (courseLevel === CourseLevel.MENENGAH) {
      score += 6;
    } else {
      score += 2;
      reasons.push("Bangun fondasi sebelum naikkan risiko");
    }
  }

  return score;
}

function scoreCourse(
  course: Course,
  answers: LearningGuidanceAnswers,
  mentorsBySlug: Map<string, Mentor>
): ScoredCourse {
  const reasons: string[] = [];
  let score = 0;
  const targetLevel = experienceToLevel(answers.experience);
  const targetLevelUi = levelToUi(targetLevel);
  const courseLevel = uiLevelToCourseLevel(course.level);
  const mentor = mentorsBySlug.get(course.mentorSlug);

  if (course.instrument !== answers.instrument) {
    return { course, score: 0, reasons: [] };
  }

  score += 40;
  reasons.push(`Fokus ${answers.instrument}`);

  const levelGap = levelDistance(targetLevel, courseLevel);
  if (levelGap === 0) {
    score += 30;
    reasons.push(`Level ${targetLevelUi} pas untukmu`);
  } else if (levelGap === 1) {
    if (answers.experience === "never") {
      score += 4;
      reasons.push("Satu tingkat di atas — pertimbangkan setelah fondasi");
    } else {
      score += 15;
      reasons.push("Satu tingkat di atas/bawah levelmu — masih relevan");
    }
  } else {
    score -= 8;
  }

  if (answers.timeAvailability === "minimal") {
    if (course.durationHours <= 10) {
      score += 20;
      reasons.push("Durasi ringkas untuk waktu terbatas");
    } else if (course.durationHours <= 20) {
      score += 10;
    } else {
      score -= 4;
    }
  } else if (answers.timeAvailability === "part_time") {
    if (course.durationHours >= 8 && course.durationHours <= 30) {
      score += 15;
      reasons.push("Durasi seimbang untuk belajar rutin");
    }
  } else if (course.durationHours >= 15) {
    score += 10;
    reasons.push("Materi mendalam untuk komitmen penuh");
  }

  if (answers.tradingStyle === "scalping" && course.durationHours <= 15) {
    score += 8;
    reasons.push("Cocok untuk trader aktif jangka pendek");
  }
  if (answers.tradingStyle === "swing" && course.durationHours >= 8 && course.durationHours <= 25) {
    score += 8;
    reasons.push("Durasi pas untuk swing trading");
  }
  if (answers.tradingStyle === "long_term" && course.durationHours >= 12) {
    score += 8;
    reasons.push("Mendukung strategi jangka panjang");
  }

  if (answers.goal === "basics" && course.level === "Pemula") {
    score += 12;
    reasons.push("Fokus fondasi untuk pemula");
  }
  if (answers.goal === "side_income" && course.level === "Menengah") {
    score += 8;
    reasons.push("Level praktis untuk penghasilan sampingan");
  }
  if (answers.goal === "wealth" && (course.level === "Menengah" || course.level === "Mahir")) {
    score += 8;
    reasons.push("Mendukung akumulasi jangka menengah");
  }
  if (
    answers.goal === "retirement" &&
    answers.riskTolerance === "conservative" &&
    course.level !== "Mahir"
  ) {
    score += 8;
    reasons.push("Pendekatan stabil untuk tujuan jangka panjang");
  }

  score += scoreRiskFit(answers, courseLevel, reasons);
  score += scoreCapitalFit(answers, courseLevel, reasons);

  if (answers.learningFormat === "live" && mentor?.availableFor1on1) {
    score += 15;
    reasons.push("Mentor tersedia untuk sesi 1-on-1");
  }
  if (answers.learningFormat === "community" && course.studentsCount >= 50) {
    score += 10;
    reasons.push("Komunitas belajar yang aktif");
  }
  if (answers.learningFormat === "video") {
    score += 5;
    reasons.push("Belajar mandiri dengan video terstruktur");
  }
  if (answers.learningFormat === "mixed") {
    score += 8;
    reasons.push("Format fleksibel — video, live, dan komunitas");
  }

  score += qualityTiebreaker(course, mentor);

  return { course, score, reasons: reasons.slice(0, 3) };
}

function scoreMentor(mentor: Mentor, answers: LearningGuidanceAnswers): ScoredMentor {
  const reasons: string[] = [];
  let score = 0;

  if (!mentor.instruments.includes(answers.instrument)) {
    return { mentor, score: 0, reasons: [] };
  }

  score += 40;
  reasons.push(`Spesialis ${answers.instrument}`);

  if (answers.learningFormat === "live" && mentor.availableFor1on1) {
    score += 20;
    reasons.push("Buka sesi live 1-on-1");
  }

  if (answers.experience === "profitable" && mentor.yearsExperience >= 8) {
    score += 12;
    reasons.push("Pengalaman mendalam untuk trader lanjutan");
  }
  if (
    (answers.experience === "never" || answers.experience === "demo") &&
    mentor.yearsExperience >= 3
  ) {
    score += 10;
    reasons.push("Pengalaman mengajar pemula");
  }

  if (answers.riskTolerance === "conservative" && mentor.yearsExperience >= 5) {
    score += 6;
    reasons.push("Track record mentor untuk disiplin risiko");
  }

  if (answers.learningFormat === "community" && mentor.studentsCount >= 100) {
    score += 10;
    reasons.push("Komunitas murid yang besar");
  }
  if (answers.learningFormat === "mixed") {
    score += 6;
    reasons.push("Mentor dengan berbagai format belajar");
  }

  score += Math.min(mentor.rating * 3, 15);

  if (mentor.verified) {
    score += 8;
    reasons.push("Mentor terverifikasi");
  }

  return { mentor, score, reasons: reasons.slice(0, 3) };
}

function buildPathNarrative(answers: LearningGuidanceAnswers): {
  summary: string;
  pathTitle: string;
  pathSteps: string[];
} {
  const levelLabel = levelToUi(experienceToLevel(answers.experience));
  const styleLabel =
    answers.tradingStyle === "scalping"
      ? "scalping"
      : answers.tradingStyle === "swing"
        ? "swing trading"
        : "investasi jangka panjang";

  const goalLabel =
    answers.goal === "basics"
      ? "membangun fondasi yang kuat"
      : answers.goal === "side_income"
        ? "mencari penghasilan tambahan"
        : answers.goal === "wealth"
          ? "mengakumulasi kekayaan"
          : "mempersiapkan portofolio pensiun";

  const riskNote =
    answers.riskTolerance === "conservative"
      ? answers.instrument === "Forex"
        ? "Profil konservatif + Forex: mulai tanpa leverage tinggi dan posisi sangat kecil."
        : "Dengan profil risiko konservatif, mulai dari manajemen risiko dan posisi kecil."
      : answers.riskTolerance === "aggressive"
        ? "Profil agresif — pastikan disiplin stop-loss dan jangan over-leverage."
        : "Dengan risiko seimbang, kombinasikan teori dengan latihan terukur.";

  const capitalNote =
    answers.capitalRange && answers.capitalRange !== "prefer_not_say"
      ? answers.capitalRange === "under_5m"
        ? " Modal kecil — prioritaskan belajar di demo sebelum live."
        : answers.capitalRange === "above_50m"
          ? " Modal signifikan — manajemen risiko harus jadi prioritas #1."
          : ""
      : "";

  const experienceStep =
    answers.experience === "never"
      ? "Mulai dari akun demo dan kelas Pemula — jangan loncat ke live sebelum paham risk management."
      : `Mulai dari kelas level ${levelLabel} di ${answers.instrument} untuk fondasi yang tepat.`;

  return {
    pathTitle: `Jalur ${answers.instrument} · ${levelLabel}`,
    summary: `Kamu fokus ke ${answers.instrument} dengan gaya ${styleLabel} untuk ${goalLabel}. ${riskNote}${capitalNote}`,
    pathSteps: [
      experienceStep,
      answers.learningFormat === "live"
        ? "Manfaatkan sesi live mentor untuk validasi strategi secara langsung."
        : answers.learningFormat === "community"
          ? "Gabung komunitas mentor untuk belajar dari diskusi dan studi kasus."
          : "Ikuti video secara berurutan — jangan loncat sebelum paham risk management.",
      answers.timeAvailability === "minimal"
        ? "Alokasikan 20–30 menit per hari; konsistensi lebih penting dari durasi."
        : "Jadwalkan 3–5 sesi belajar per minggu dan catat setiap evaluasi trading.",
      "Rekomendasi ini berdasarkan jawabanmu — bukan jaminan hasil. Review ulang jika tujuan atau instrumenmu berubah.",
    ],
  };
}

export async function computeLearningGuidance(
  answers: LearningGuidanceAnswers,
  profile?: LearningGuidanceProfileRecord
): Promise<LearningGuidanceResult> {
  const [courses, mentors] = await Promise.all([getCatalogCourses(), getCatalogMentors()]);

  const mentorsBySlug = new Map(mentors.map((m) => [m.slug, m]));

  const scoredCourses = courses
    .filter((c) => c.instrument === answers.instrument)
    .map((course) => scoreCourse(course, answers, mentorsBySlug))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const scoredMentors = mentors
    .filter((m) => m.instruments.includes(answers.instrument))
    .map((mentor) => scoreMentor(mentor, answers))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const narrative = buildPathNarrative(answers);

  return {
    ...narrative,
    courses: scoredCourses,
    mentors: scoredMentors,
    profile:
      profile ??
      serializeProfileRecord({
        ...answersToProfileData(answers),
        completedAt: new Date(),
      }),
  };
}

export function answersFromProfileRecord(
  profile: LearningGuidanceProfileRecord
): LearningGuidanceAnswers {
  const experience = tierToExperience(profile.experienceTier);

  const styleMap: Record<LearningTradingStyle, LearningGuidanceAnswers["tradingStyle"]> = {
    SCALPING: "scalping",
    SWING: "swing",
    LONG_TERM: "long_term",
  };

  const goalMap: Record<LearningGoal, LearningGuidanceAnswers["goal"]> = {
    SIDE_INCOME: "side_income",
    WEALTH_BUILDING: "wealth",
    LEARN_BASICS: "basics",
    RETIREMENT: "retirement",
  };

  const riskMap: Record<LearningRiskTolerance, LearningGuidanceAnswers["riskTolerance"]> = {
    CONSERVATIVE: "conservative",
    MODERATE: "moderate",
    AGGRESSIVE: "aggressive",
  };

  const timeMap: Record<LearningTimeAvailability, LearningGuidanceAnswers["timeAvailability"]> = {
    MINIMAL: "minimal",
    PART_TIME: "part_time",
    DEDICATED: "dedicated",
  };

  const formatMap: Record<LearningFormat, LearningGuidanceAnswers["learningFormat"]> = {
    VIDEO: "video",
    LIVE: "live",
    COMMUNITY: "community",
    MIXED: "mixed",
  };

  const capitalMap: Partial<
    Record<LearningCapitalRange, NonNullable<LearningGuidanceAnswers["capitalRange"]>>
  > = {
    UNDER_5M: "under_5m",
    FROM_5M_TO_20M: "5_20m",
    FROM_20M_TO_50M: "20_50m",
    ABOVE_50M: "above_50m",
    PREFER_NOT_SAY: "prefer_not_say",
  };

  return {
    instrument: instrumentToUi(profile.instrument),
    experience,
    tradingStyle: styleMap[profile.tradingStyle],
    goal: goalMap[profile.goal],
    riskTolerance: riskMap[profile.riskTolerance],
    timeAvailability: timeMap[profile.timeAvailability],
    capitalRange: profile.capitalRange ? capitalMap[profile.capitalRange] : undefined,
    learningFormat: formatMap[profile.learningFormat],
  };
}
