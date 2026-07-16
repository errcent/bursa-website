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

import { instrumentFromUi, instrumentToUi, levelToUi } from "@/lib/admin/server";
import { getCatalogCourses, getCatalogMentors } from "@/lib/catalog/server";
import type {
  LearningGuidanceAnswers,
  LearningGuidanceProfileRecord,
  LearningGuidanceResult,
  ScoredCourse,
  ScoredMentor,
} from "@/lib/learning/guidance/types";
import type { Course, Mentor } from "@/lib/types";

const LEVEL_ORDER: CourseLevel[] = [CourseLevel.PEMULA, CourseLevel.MENENGAH, CourseLevel.MAHIR];

function experienceToLevel(experience: LearningGuidanceAnswers["experience"]): CourseLevel {
  const map: Record<LearningGuidanceAnswers["experience"], CourseLevel> = {
    never: CourseLevel.PEMULA,
    demo: CourseLevel.PEMULA,
    regular: CourseLevel.MENENGAH,
    profitable: CourseLevel.MAHIR,
  };
  return map[experience];
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

function scoreCourse(course: Course, answers: LearningGuidanceAnswers, mentorsBySlug: Map<string, Mentor>): ScoredCourse {
  const reasons: string[] = [];
  let score = 0;
  const targetLevel = experienceToLevel(answers.experience);
  const targetLevelUi = levelToUi(targetLevel);
  const mentor = mentorsBySlug.get(course.mentorSlug);

  if (course.instrument === answers.instrument) {
    score += 50;
    reasons.push(`Sesuai fokus ${answers.instrument}`);
  }

  const levelGap = levelDistance(
    targetLevel,
    course.level === "Pemula"
      ? CourseLevel.PEMULA
      : course.level === "Menengah"
        ? CourseLevel.MENENGAH
        : CourseLevel.MAHIR
  );
  if (levelGap === 0) {
    score += 30;
    reasons.push(`Level ${targetLevelUi} pas untukmu`);
  } else if (levelGap === 1) {
    score += 15;
    reasons.push(`Satu tingkat di atas/bawah levelmu — masih relevan`);
  }

  if (answers.timeAvailability === "minimal") {
    if (course.durationHours <= 10) {
      score += 20;
      reasons.push("Durasi ringkas untuk waktu terbatas");
    } else if (course.durationHours <= 20) {
      score += 10;
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
  }
  if (answers.goal === "retirement" && answers.riskTolerance === "conservative" && course.level !== "Mahir") {
    score += 6;
    reasons.push("Pendekatan stabil untuk tujuan jangka panjang");
  }

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
  }

  score += Math.min(course.rating * 4, 20);
  score += Math.min(Math.log10(course.studentsCount + 1) * 5, 15);

  return { course, score, reasons: reasons.slice(0, 3) };
}

function scoreMentor(mentor: Mentor, answers: LearningGuidanceAnswers): ScoredMentor {
  const reasons: string[] = [];
  let score = 0;

  if (mentor.instruments.includes(answers.instrument)) {
    score += 40;
    reasons.push(`Spesialis ${answers.instrument}`);
  }

  if (answers.learningFormat === "live" && mentor.availableFor1on1) {
    score += 20;
    reasons.push("Buka sesi live 1-on-1");
  }

  if (answers.experience === "profitable" && mentor.yearsExperience >= 8) {
    score += 12;
    reasons.push("Pengalaman mendalam untuk trader lanjutan");
  }
  if ((answers.experience === "never" || answers.experience === "demo") && mentor.yearsExperience >= 3) {
    score += 8;
    reasons.push("Pengalaman mengajar pemula");
  }

  if (answers.learningFormat === "community" && mentor.studentsCount >= 100) {
    score += 10;
    reasons.push("Komunitas murid yang besar");
  }

  score += mentor.rating * 5;
  score += Math.min(Math.log10(mentor.studentsCount + 1) * 6, 18);

  if (mentor.verified) {
    score += 5;
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
      ? "Dengan profil risiko konservatif, mulai dari manajemen risiko dan posisi kecil."
      : answers.riskTolerance === "aggressive"
        ? "Profil agresif — pastikan disiplin stop-loss dan jangan over-leverage."
        : "Dengan risiko seimbang, kombinasikan teori dengan latihan terukur.";

  return {
    pathTitle: `Jalur ${answers.instrument} · ${levelLabel}`,
    summary: `Kamu fokus ke ${answers.instrument} dengan gaya ${styleLabel} untuk ${goalLabel}. ${riskNote}`,
    pathSteps: [
      `Mulai dari kelas level ${levelLabel} di ${answers.instrument} untuk fondasi yang tepat.`,
      answers.learningFormat === "live"
        ? "Manfaatkan sesi live mentor untuk validasi strategi secara langsung."
        : answers.learningFormat === "community"
          ? "Gabung komunitas mentor untuk belajar dari diskusi dan studi kasus."
          : "Ikuti modul video secara berurutan — jangan loncat sebelum paham risk management.",
      answers.timeAvailability === "minimal"
        ? "Alokasikan 20–30 menit per hari; konsistensi lebih penting dari durasi."
        : "Jadwalkan 3–5 sesi belajar per minggu dan catat setiap evaluasi trading.",
      "Setelah kelas dasar, review ulang panduan ini jika tujuan atau instrumenmu berubah.",
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
    .filter((c) => c.instrument === answers.instrument || mentorsBySlug.get(c.mentorSlug)?.instruments.includes(answers.instrument))
    .map((course) => scoreCourse(course, answers, mentorsBySlug))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const fallbackCourses = courses
    .filter((c) => c.instrument === answers.instrument)
    .map((course) => scoreCourse(course, answers, mentorsBySlug))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const finalCourses = scoredCourses.length > 0 ? scoredCourses : fallbackCourses;

  const scoredMentors = mentors
    .filter((m) => m.instruments.includes(answers.instrument))
    .map((mentor) => scoreMentor(mentor, answers))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const narrative = buildPathNarrative(answers);

  return {
    ...narrative,
    courses: finalCourses,
    mentors: scoredMentors,
    profile:
      profile ??
      serializeProfileRecord({
        ...answersToProfileData(answers),
        completedAt: new Date(),
      }),
  };
}

export function answersFromProfileRecord(profile: LearningGuidanceProfileRecord): LearningGuidanceAnswers {
  const experienceMap: Record<CourseLevel, LearningGuidanceAnswers["experience"]> = {
    PEMULA: "demo",
    MENENGAH: "regular",
    MAHIR: "profitable",
  };

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
    experience: experienceMap[profile.experienceLevel],
    tradingStyle: styleMap[profile.tradingStyle],
    goal: goalMap[profile.goal],
    riskTolerance: riskMap[profile.riskTolerance],
    timeAvailability: timeMap[profile.timeAvailability],
    capitalRange: profile.capitalRange ? capitalMap[profile.capitalRange] : undefined,
    learningFormat: formatMap[profile.learningFormat],
  };
}
