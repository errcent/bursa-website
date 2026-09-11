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
import { archetypeNarrativeHint, deriveGuidanceArchetype } from "@/lib/learning/guidance/archetype";
import { evaluatePlaylistCoherence } from "@/lib/learning/guidance/coherence";
import { mergeGuidancePicks, splitGuidancePicks } from "@/lib/learning/guidance/picks";
import {
  analyzeProfile,
  scoreCourseForGuidance,
} from "@/lib/learning/guidance/scoring";
import { profileTimeBand, resolvePlaylistTags } from "@/lib/learning/guidance/tags";
import type {
  LearningGuidanceAnswers,
  LearningGuidanceGap,
  LearningGuidanceProfileRecord,
  LearningGuidanceResult,
  ScoredCourse,
  ScoredPlaylist,
} from "@/lib/learning/guidance/types";
import { listCuratedPlaylists, serializePlaylistSummary } from "@/lib/playlist/server";
import { CURATED_PLAYLIST_META } from "@/lib/thumbnails/curated-playlist-meta";

type LearningFormatAnswer = NonNullable<LearningGuidanceAnswers["learningFormat"]>;

const DEFAULT_LEARNING_FORMAT: LearningFormatAnswer = "mixed";

function resolveLearningFormat(
  answers: LearningGuidanceAnswers
): LearningFormatAnswer {
  return answers.learningFormat ?? DEFAULT_LEARNING_FORMAT;
}

/** Prisma enum values as literals, safe before `prisma generate` refreshes runtime exports. */
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
  profileTags: string[];
  pathSteps: string[];
} {
  const stylePhrase: Record<LearningGuidanceAnswers["tradingStyle"], string> = {
    scalping: "ritme cepat (scalping)",
    day_trading: "day trading",
    swing: "swing trading",
    long_term: "investasi jangka panjang",
  };

  const goalPhrase: Record<LearningGuidanceAnswers["goal"], string> = {
    basics: "membangun fondasi",
    side_income: "penghasilan sampingan",
    wealth: "membangun kekayaan",
    retirement: "persiapan pensiun",
  };

  const timePhrase: Record<LearningGuidanceAnswers["timeAvailability"], string> = {
    minimal: "waktu belajar terbatas",
    part_time: "belajar di sela rutinitas",
    dedicated: "komitmen belajar yang intensif",
  };

  const instrument = answers.instrument.toLowerCase();
  const level = profile.idealLevelUi.toLowerCase();
  const gapPhrase: Record<LearningGuidanceGap, string> = {
    no_foundation: "Kami mulai dari fondasi yang jelas",
    emotional_control: "Kami prioritaskan disiplin dan mindset dulu",
    inconsistent_execution: "Kami fokus ke struktur yang bisa langsung dipraktikkan",
    ready_for_depth: "Kami arahkan ke pendalaman yang sesuai levelmu",
  };

  const archetype = deriveGuidanceArchetype(answers, profile);
  const hint = archetypeNarrativeHint(archetype);
  const intro = [
    `Kamu ingin belajar ${instrument} dengan ritme ${stylePhrase[answers.tradingStyle]}, fokus ${goalPhrase[answers.goal]}, dan ${timePhrase[answers.timeAvailability]}.`,
    `${gapPhrase[answers.learningGap]}.`,
    hint,
    `Berikut kurasi kelas dan playlist yang paling selaras, level ${level}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    pathTitle: `${answers.instrument} · ${profile.idealLevelUi}`,
    summary: intro,
    profileTags: [],
    pathSteps: [],
  };
}

function scoreExperienceFitForPlaylist(
  answers: LearningGuidanceAnswers,
  tags: ReturnType<typeof resolvePlaylistTags>
): { points: number; reason?: string } {
  const isBeginner = answers.experience === "never" || answers.experience === "demo";
  if (isBeginner && tags.level === "beginner") {
    return { points: 22, reason: "Cocok untuk pemula" };
  }
  if (answers.experience === "regular" && tags.level !== "advanced") {
    return { points: 16, reason: "Langkah lanjutan yang terstruktur" };
  }
  if (answers.experience === "profitable" && tags.level === "intermediate") {
    return { points: 14, reason: "Pendalaman untuk trader berpengalaman" };
  }
  if (isBeginner && tags.level === "advanced") {
    return { points: -30 };
  }
  return { points: 8 };
}

function scoreStyleFitForPlaylist(
  answers: LearningGuidanceAnswers,
  tags: ReturnType<typeof resolvePlaylistTags>
): { points: number; reason?: string } {
  if (tags.styles.includes(answers.tradingStyle)) {
    const styleLabel: Record<LearningGuidanceAnswers["tradingStyle"], string> = {
      scalping: "scalping",
      day_trading: "day trading",
      swing: "swing",
      long_term: "investasi jangka panjang",
    };
    return { points: 18, reason: `Cocok untuk ${styleLabel[answers.tradingStyle]}` };
  }
  return { points: 0 };
}

function scoreGoalFitForPlaylist(
  answers: LearningGuidanceAnswers,
  tags: ReturnType<typeof resolvePlaylistTags>
): { points: number; reason?: string } {
  if (tags.goals.includes(answers.goal)) {
    if (answers.goal === "basics") return { points: 14, reason: "Membangun fondasi" };
    if (answers.goal === "retirement") return { points: 12, reason: "Pendekatan stabil jangka panjang" };
    return { points: 10 };
  }
  return { points: 0 };
}

function scoreTimeFitForPlaylist(
  answers: LearningGuidanceAnswers,
  tags: ReturnType<typeof resolvePlaylistTags>
): { points: number; reason?: string } {
  const band = profileTimeBand(answers.timeAvailability);
  if (band === "low" && tags.compactFriendly) {
    return { points: 10, reason: "Ringkas untuk waktu terbatas" };
  }
  if (band === "high" && tags.deepFriendly) {
    return { points: 8 };
  }
  if (tags.timeBands.includes(band)) {
    return { points: 6 };
  }
  return { points: 0 };
}

function scorePlaylistForGuidance(
  playlist: ReturnType<typeof serializePlaylistSummary>,
  answers: LearningGuidanceAnswers,
  recommendedCourseSlugs: Set<string>,
  playlistCourseSlugs: string[]
): { score: number; reasons: string[] } {
  const meta = CURATED_PLAYLIST_META.find((entry) => entry.slug === playlist.slug);
  const tags = resolvePlaylistTags(playlist.slug, playlist.title);
  const reasons: string[] = [];
  let score = 0;

  if (!meta?.instruments.includes(answers.instrument)) {
    return { score: 0, reasons: [] };
  }

  score += 40;

  const dimensions = [
    scoreExperienceFitForPlaylist(answers, tags),
    scoreStyleFitForPlaylist(answers, tags),
    scoreGoalFitForPlaylist(answers, tags),
    scoreTimeFitForPlaylist(answers, tags),
  ];

  for (const dim of dimensions) {
    score += dim.points;
    if (dim.reason && dim.points > 0 && !reasons.includes(dim.reason)) {
      reasons.push(dim.reason);
    }
  }

  const overlap = playlistCourseSlugs.filter((slug) => recommendedCourseSlugs.has(slug)).length;
  if (overlap > 0) {
    score += Math.min(overlap * 12, 24);
    reasons.push("Berisi kelas rekomendasi");
  }

  const coherence = evaluatePlaylistCoherence(answers, tags);
  if (coherence.excluded) {
    return { score: 0, reasons: [] };
  }

  score = Math.round(score * coherence.multiplier + coherence.bonus);
  for (const reason of coherence.reasons) {
    if (!reasons.includes(reason)) reasons.push(reason);
  }

  return { score, reasons: reasons.slice(0, 2) };
}

export async function computeLearningGuidance(
  answers: LearningGuidanceAnswers,
  profile?: LearningGuidanceProfileRecord
): Promise<LearningGuidanceResult> {
  const resolvedAnswers: LearningGuidanceAnswers = {
    ...answers,
    learningFormat: resolveLearningFormat(answers),
  };

  const [courses, mentors, curatedPlaylists] = await Promise.all([
    getCatalogCourses(),
    getCatalogMentors(),
    listCuratedPlaylists(),
  ]);

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

  const courseRankPool = [...allScoredCourses]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title));

  const recommendedCourseSlugs = new Set(
    courseRankPool.slice(0, 8).map((entry) => entry.course.slug)
  );

  const scoredPlaylists: ScoredPlaylist[] = curatedPlaylists
    .map((raw) => {
      const playlist = serializePlaylistSummary(raw);
      const courseSlugs = raw.items
        .map((item) => item.lesson?.module.course.slug ?? item.course?.slug ?? null)
        .filter((slug): slug is string => Boolean(slug));
      const { score, reasons } = scorePlaylistForGuidance(
        playlist,
        resolvedAnswers,
        recommendedCourseSlugs,
        courseSlugs
      );
      return { playlist, score, reasons };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.playlist.title.localeCompare(b.playlist.title)
    );

  const merged = mergeGuidancePicks(courseRankPool, scoredPlaylists);
  const { primary, supporting } = splitGuidancePicks(merged);

  const narrative = buildPathNarrative(resolvedAnswers, profileAnalysis);

  return {
    ...narrative,
    primary,
    supporting,
    courses: courseRankPool,
    playlists: scoredPlaylists,
    mentors: [],
    profile:
      profile ??
      serializeProfileRecord({
        ...answersToProfileData(resolvedAnswers),
        completedAt: new Date(),
      }),
  };
}

function inferLearningGapFromProfile(
  profile: LearningGuidanceProfileRecord,
  experience: LearningGuidanceAnswers["experience"]
): LearningGuidanceGap {
  if (profile.goal === LearningGoal.LEARN_BASICS || experience === "never" || experience === "demo") {
    return "no_foundation";
  }
  if (experience === "profitable") {
    return "ready_for_depth";
  }
  if (profile.riskTolerance === LearningRiskTolerance.CONSERVATIVE) {
    return "emotional_control";
  }
  return "inconsistent_execution";
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
    learningGap: inferLearningGapFromProfile(profile, experience),
    capitalRange: profile.capitalRange ? capitalMap[profile.capitalRange] : undefined,
    learningFormat: formatMap[profile.learningFormat],
  };
}
