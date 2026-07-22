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

import { instrumentFromUi, instrumentToUi } from "@/lib/admin/server";
import { getCatalogCourses, getCatalogMentors } from "@/lib/catalog/server";
import {
  analyzeProfile,
  scoreCourseForGuidance,
  scoreMentorForGuidance,
  selectCourseRecommendations,
  selectMentorRecommendations,
} from "@/lib/learning/guidance/scoring";
import type {
  LearningGuidanceAnswers,
  LearningGuidanceProfileRecord,
  LearningGuidanceResult,
  ScoredCourse,
  ScoredMentor,
} from "@/lib/learning/guidance/types";

type LearningFormatAnswer = NonNullable<LearningGuidanceAnswers["learningFormat"]>;

const DEFAULT_LEARNING_FORMAT: LearningFormatAnswer = "mixed";

function resolveLearningFormat(
  answers: LearningGuidanceAnswers
): LearningFormatAnswer {
  return answers.learningFormat ?? DEFAULT_LEARNING_FORMAT;
}

/** Prisma enum values as literals — safe before `prisma generate` refreshes runtime exports. */
const EXPERIENCE_TIER = {
  NEVER: "NEVER",
  DEMO: "DEMO",
  REGULAR: "REGULAR",
  PROFITABLE: "PROFITABLE",
} as const satisfies Record<string, LearningExperience>;

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
    day_trading: LearningTradingStyle.DAY_TRADING,
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

function formatToDb(format: LearningFormatAnswer): LearningFormat {
  const map: Record<LearningFormatAnswer, LearningFormat> = {
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
    learningFormat: formatToDb(resolveLearningFormat(answers)),
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

function buildPathNarrative(
  answers: LearningGuidanceAnswers,
  profile: ReturnType<typeof analyzeProfile>
): {
  summary: string;
  pathTitle: string;
  pathSteps: string[];
} {
  const levelLabel = profile.idealLevelUi;
  const styleLabel =
    answers.tradingStyle === "scalping"
      ? "scalping"
      : answers.tradingStyle === "day_trading"
        ? "day trading"
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
      ? `Mulai dari akun demo dan kelas ${profile.idealLevelUi} — jangan loncat ke live sebelum paham risk management.`
      : profile.maxLevelIndex < 2
        ? `Fokus ke kelas level ${levelLabel} di ${answers.instrument} — hindari materi Mahir dulu sampai fondasi kuat.`
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
  const resolvedAnswers: LearningGuidanceAnswers = {
    ...answers,
    learningFormat: resolveLearningFormat(answers),
  };

  const [courses, mentors] = await Promise.all([getCatalogCourses(), getCatalogMentors()]);

  const mentorsBySlug = new Map(mentors.map((m) => [m.slug, m]));
  const profileAnalysis = analyzeProfile(resolvedAnswers);

  const allScoredCourses = courses
    .filter((c) => c.instrument === resolvedAnswers.instrument)
    .map((course) => {
      const { score, reasons } = scoreCourseForGuidance(
        course,
        resolvedAnswers,
        profileAnalysis,
        mentorsBySlug.get(course.mentorSlug)
      );
      return { course, score, reasons };
    });

  const scoredCourses: ScoredCourse[] = selectCourseRecommendations(allScoredCourses);

  const topCourseMentorSlugs = new Set(scoredCourses.map((entry) => entry.course.mentorSlug));

  const scoredMentors: ScoredMentor[] = selectMentorRecommendations(
    mentors
      .map((mentor) => {
        const { score, reasons } = scoreMentorForGuidance(
          mentor,
          resolvedAnswers,
          allScoredCourses
        );
        return { mentor, score, reasons };
      }),
    topCourseMentorSlugs
  );

  const narrative = buildPathNarrative(resolvedAnswers, profileAnalysis);

  return {
    ...narrative,
    courses: scoredCourses,
    mentors: scoredMentors,
    profile:
      profile ??
      serializeProfileRecord({
        ...answersToProfileData(resolvedAnswers),
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
    DAY_TRADING: "day_trading",
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
