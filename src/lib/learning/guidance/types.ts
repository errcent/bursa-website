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

import type { Course, Instrument as UiInstrument, Level, Mentor } from "@/lib/types";

/** Wire format sent from the quiz UI to the API. */
export interface LearningGuidanceAnswers {
  instrument: UiInstrument;
  experience: "never" | "demo" | "regular" | "profitable";
  tradingStyle: "scalping" | "swing" | "long_term";
  goal: "side_income" | "wealth" | "basics" | "retirement";
  riskTolerance: "conservative" | "moderate" | "aggressive";
  timeAvailability: "minimal" | "part_time" | "dedicated";
  capitalRange?: "under_5m" | "5_20m" | "20_50m" | "above_50m" | "prefer_not_say";
  learningFormat: "video" | "live" | "community" | "mixed";
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

export interface LearningGuidanceResult {
  summary: string;
  pathTitle: string;
  pathSteps: string[];
  courses: ScoredCourse[];
  mentors: ScoredMentor[];
  profile?: LearningGuidanceProfileRecord;
}
