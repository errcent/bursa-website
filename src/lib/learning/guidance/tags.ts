import type { Course, Level } from "@/lib/types";

import type { LearningGuidanceAnswers } from "@/lib/learning/guidance/types";

export type GuidanceLevelTag = "beginner" | "intermediate" | "advanced";
export type GuidanceStyleTag = LearningGuidanceAnswers["tradingStyle"];
export type GuidanceGoalTag = LearningGuidanceAnswers["goal"];
export type GuidanceRiskTag = LearningGuidanceAnswers["riskTolerance"];
export type GuidanceTimeTag = "low" | "med" | "high";

export interface GuidanceContentTags {
  level: GuidanceLevelTag;
  styles: GuidanceStyleTag[];
  goals: GuidanceGoalTag[];
  riskLevels: GuidanceRiskTag[];
  timeBands: GuidanceTimeTag[];
  compactFriendly: boolean;
  deepFriendly: boolean;
  psychology?: boolean;
  riskManagement?: boolean;
  source: "explicit" | "inferred";
}

const ALL_STYLES: GuidanceStyleTag[] = ["scalping", "day_trading", "swing", "long_term"];
const ALL_GOALS: GuidanceGoalTag[] = ["basics", "side_income", "wealth", "retirement"];
const ALL_RISKS: GuidanceRiskTag[] = ["conservative", "moderate", "aggressive"];

type TagOverride = Omit<GuidanceContentTags, "source">;

const COURSE_TAG_OVERRIDES: Record<string, TagOverride> = {
  "fundamental-saham-untuk-pemula": {
    level: "beginner",
    styles: ["long_term", "swing"],
    goals: ["basics", "wealth", "retirement"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "membaca-laporan-keuangan-lanjutan": {
    level: "intermediate",
    styles: ["long_term"],
    goals: ["wealth"],
    riskLevels: ["moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "swing-trading-teknikal-dasar": {
    level: "beginner",
    styles: ["swing"],
    goals: ["basics", "side_income"],
    riskLevels: ["moderate"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
  },
  "crypto-on-chain-dasar": {
    level: "intermediate",
    styles: ["swing", "day_trading"],
    goals: ["wealth", "side_income"],
    riskLevels: ["moderate", "aggressive"],
    timeBands: ["med"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "manajemen-risiko-crypto-pemula": {
    level: "beginner",
    styles: ALL_STYLES,
    goals: ["basics"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
    psychology: true,
    riskManagement: true,
  },
  "forex-makro-dasar": {
    level: "beginner",
    styles: ["swing", "long_term", "day_trading"],
    goals: ["basics"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "screening-saham-dividen-konsisten": {
    level: "intermediate",
    styles: ["long_term", "swing"],
    goals: ["wealth", "retirement"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
  },
  "price-action-swing-saham-menengah": {
    level: "intermediate",
    styles: ["swing"],
    goals: ["side_income", "wealth"],
    riskLevels: ["moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "siklus-bitcoin-halving-dan-makro-kripto": {
    level: "intermediate",
    styles: ["swing", "long_term"],
    goals: ["wealth"],
    riskLevels: ["moderate"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
  },
  "scalping-saham-intraday-jam-perdagangan": {
    level: "beginner",
    styles: ["scalping", "day_trading"],
    goals: ["side_income"],
    riskLevels: ["moderate", "aggressive"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
  },
  "eksekusi-scalping-order-book-idx": {
    level: "intermediate",
    styles: ["scalping", "day_trading"],
    goals: ["side_income"],
    riskLevels: ["moderate", "aggressive"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
  },
  "price-action-forex-tanpa-indikator": {
    level: "beginner",
    styles: ["day_trading", "swing"],
    goals: ["basics", "side_income"],
    riskLevels: ["moderate"],
    timeBands: ["med"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "scalping-forex-sesi-london-ny": {
    level: "intermediate",
    styles: ["scalping", "day_trading"],
    goals: ["side_income"],
    riskLevels: ["aggressive"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
  },
  "defi-dan-tokenomics-pemula": {
    level: "beginner",
    styles: ["long_term", "swing"],
    goals: ["basics", "wealth"],
    riskLevels: ["moderate"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
  },
  "riset-narrative-kripto-menengah": {
    level: "intermediate",
    styles: ["swing", "day_trading"],
    goals: ["wealth", "side_income"],
    riskLevels: ["moderate", "aggressive"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
  },
  "psikologi-trading-anti-fomo": {
    level: "beginner",
    styles: ALL_STYLES,
    goals: ["basics", "side_income"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
    psychology: true,
  },
  "blueprint-manajemen-risiko-trader": {
    level: "intermediate",
    styles: ALL_STYLES,
    goals: ["side_income", "wealth"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
    riskManagement: true,
  },
};

const PLAYLIST_TAG_OVERRIDES: Record<string, TagOverride> = {
  "kesehatan-mental-trading": {
    level: "beginner",
    styles: ALL_STYLES,
    goals: ["basics", "side_income"],
    riskLevels: ALL_RISKS,
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
    psychology: true,
  },
  "fundasi-analisis-saham": {
    level: "beginner",
    styles: ["long_term", "swing"],
    goals: ["basics", "wealth"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "jalur-crypto-pemula": {
    level: "beginner",
    styles: ["swing", "day_trading"],
    goals: ["basics"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["low", "med"],
    compactFriendly: true,
    deepFriendly: false,
    riskManagement: true,
  },
  "teknikal-swing-trading": {
    level: "beginner",
    styles: ["swing"],
    goals: ["basics", "side_income"],
    riskLevels: ["moderate"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
  },
  "forex-dari-nol": {
    level: "beginner",
    styles: ["swing", "long_term", "day_trading"],
    goals: ["basics"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "valuasi-lanjutan": {
    level: "intermediate",
    styles: ["long_term"],
    goals: ["wealth"],
    riskLevels: ["moderate"],
    timeBands: ["med", "high"],
    compactFriendly: false,
    deepFriendly: true,
  },
  "screening-saham-berkualitas": {
    level: "beginner",
    styles: ["long_term", "swing"],
    goals: ["wealth", "retirement"],
    riskLevels: ["conservative", "moderate"],
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
  },
};

function levelFromCourse(level: Level): GuidanceLevelTag {
  if (level === "Pemula") return "beginner";
  if (level === "Menengah") return "intermediate";
  return "advanced";
}

function inferStylesFromText(text: string): GuidanceStyleTag[] {
  const styles = new Set<GuidanceStyleTag>();
  if (text.includes("scalp")) styles.add("scalping");
  if (text.includes("intraday") || text.includes("day trading")) styles.add("day_trading");
  if (text.includes("swing")) styles.add("swing");
  if (
    text.includes("jangka panjang") ||
    text.includes("dividen") ||
    text.includes("valuasi") ||
    text.includes("fundamental") ||
    text.includes("investasi")
  ) {
    styles.add("long_term");
  }
  return styles.size > 0 ? [...styles] : ["swing"];
}

function inferGoalsFromText(text: string): GuidanceGoalTag[] {
  const goals = new Set<GuidanceGoalTag>();
  if (text.includes("pemula") || text.includes("dasar") || text.includes("fundasi") || text.includes("nol")) {
    goals.add("basics");
  }
  if (text.includes("dividen") || text.includes("pensiun")) goals.add("retirement");
  if (text.includes("valuasi") || text.includes("kekayaan") || text.includes("akumulasi")) {
    goals.add("wealth");
  }
  if (text.includes("intraday") || text.includes("scalp") || text.includes("samping")) {
    goals.add("side_income");
  }
  return goals.size > 0 ? [...goals] : ALL_GOALS;
}

function inferTagsFromCourse(course: Course): TagOverride {
  const haystack = `${course.slug} ${course.title} ${course.shortDescription}`.toLowerCase();
  const level = levelFromCourse(course.level);
  const styles = inferStylesFromText(haystack);
  const goals = inferGoalsFromText(haystack);
  const psychology = haystack.includes("psikologi") || haystack.includes("fomo") || haystack.includes("mental");
  const riskManagement =
    haystack.includes("manajemen risiko") ||
    haystack.includes("position sizing") ||
    haystack.includes("disiplin modal");

  return {
    level,
    styles,
    goals,
    riskLevels:
      level === "beginner"
        ? ["conservative", "moderate"]
        : level === "advanced"
          ? ["moderate", "aggressive"]
          : ALL_RISKS,
    timeBands:
      course.durationHours <= 5 ? ["low", "med"] : course.durationHours >= 8 ? ["med", "high"] : ["med"],
    compactFriendly: course.durationHours <= 6,
    deepFriendly: course.durationHours >= 5,
    psychology,
    riskManagement,
  };
}

function withSource(override: TagOverride, source: GuidanceContentTags["source"]): GuidanceContentTags {
  return { ...override, source };
}

export function resolveCourseTags(course: Course): GuidanceContentTags {
  const explicit = COURSE_TAG_OVERRIDES[course.slug];
  if (explicit) return withSource(explicit, "explicit");

  const inferred = inferTagsFromCourse(course);
  if (process.env.NODE_ENV === "development") {
    console.debug("[guidance] inferred course tags", course.slug);
  }
  return withSource(inferred, "inferred");
}

export function resolvePlaylistTags(slug: string, title: string): GuidanceContentTags {
  const explicit = PLAYLIST_TAG_OVERRIDES[slug];
  if (explicit) return withSource(explicit, "explicit");

  const haystack = `${slug} ${title}`.toLowerCase();
  const inferred: TagOverride = {
    level: haystack.includes("lanjutan") || haystack.includes("valuasi") ? "intermediate" : "beginner",
    styles: inferStylesFromText(haystack),
    goals: inferGoalsFromText(haystack),
    riskLevels: ALL_RISKS,
    timeBands: ["med"],
    compactFriendly: true,
    deepFriendly: true,
    psychology: haystack.includes("mental") || haystack.includes("psikologi"),
    riskManagement: haystack.includes("risiko") || haystack.includes("pemula"),
  };
  return withSource(inferred, "inferred");
}

export function profileTimeBand(
  time: LearningGuidanceAnswers["timeAvailability"]
): GuidanceTimeTag {
  if (time === "minimal") return "low";
  if (time === "dedicated") return "high";
  return "med";
}
