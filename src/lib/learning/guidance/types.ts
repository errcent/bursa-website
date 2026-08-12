import type {
  CourseLevel,
  Instrument,
  LearningCapitalRange,
  LearningExperience,
  LearningFormat,
  LearningGoal,
  LearningRiskTolerance,
  LearningTimeAvailability,
  LearningTradingStyle,
} from "@prisma/client";

import type { PlaylistSummary } from "@/lib/playlist/types";
import type { Course, Instrument as UiInstrument, Level, Mentor } from "@/lib/types";

/** Wire format sent from the quiz UI to the API. */
export interface LearningGuidanceAnswers {
  instrument: UiInstrument;
  experience: "never" | "demo" | "regular" | "profitable";
  tradingStyle: "scalping" | "day_trading" | "swing" | "long_term";
  goal: "side_income" | "wealth" | "basics" | "retirement";
  riskTolerance: "conservative" | "moderate" | "aggressive";
  timeAvailability: "minimal" | "part_time" | "dedicated";
  capitalRange?: "under_5m" | "5_20m" | "20_50m" | "above_50m" | "prefer_not_say";
  /** Default `mixed` when omitted (no longer asked in quiz). */
  learningFormat?: "video" | "live" | "community" | "mixed";
}

export interface LearningGuidanceProfileRecord {
  instrument: Instrument;
  experienceLevel: CourseLevel;
  experienceTier: LearningExperience;
  tradingStyle: LearningTradingStyle;
  goal: LearningGoal;
  riskTolerance: LearningRiskTolerance;
  timeAvailability: LearningTimeAvailability;
  capitalRange: LearningCapitalRange | null;
  learningFormat: LearningFormat;
  completedAt: string;
}

export interface ScoredCourse {
  course: Course;
  score: number;
  reasons: string[];
}

export interface ScoredMentor {
  mentor: Mentor;
  score: number;
  reasons: string[];
}

export interface ScoredPlaylist {
  playlist: PlaylistSummary;
  score: number;
  reasons: string[];
}

export interface LearningGuidanceResult {
  /** Short path label, e.g. "Forex · Menengah". */
  pathTitle: string;
  /** One-line profile read, kept brief for the results card. */
  summary: string;
  /** Compact chips for the results UI (style, goal, risk). */
  profileTags: string[];
  /** @deprecated Kept empty for older clients; narrative steps removed from UI. */
  pathSteps: string[];
  courses: ScoredCourse[];
  playlists: ScoredPlaylist[];
  /** @deprecated Always empty; mentor recommendations removed from guidance. */
  mentors: ScoredMentor[];
  profile?: LearningGuidanceProfileRecord;
}
