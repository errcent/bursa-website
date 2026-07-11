import type { LearningCourseProgress } from "@/hooks/use-my-learning";
import type { Course, Instrument, Mentor } from "@/lib/types";

export type RadarAxisKey =
  | "saham"
  | "crypto"
  | "forex"
  | "pemula"
  | "menengah"
  | "mahir";

export type RadarAxisDatum = {
  key: RadarAxisKey;
  label: string;
  raw: number;
  value: number;
};

export type RadarDataSource = "platform" | "user";

type AxisDef = {
  key: RadarAxisKey;
  label: string;
  matchCourse: (course: Course) => boolean;
};

const RADAR_AXES: AxisDef[] = [
  { key: "saham", label: "Saham", matchCourse: (c) => c.instrument === "Saham" },
  { key: "crypto", label: "Crypto", matchCourse: (c) => c.instrument === "Crypto" },
  { key: "forex", label: "Forex", matchCourse: (c) => c.instrument === "Forex" },
  { key: "pemula", label: "Pemula", matchCourse: (c) => c.level === "Pemula" },
  { key: "menengah", label: "Menengah", matchCourse: (c) => c.level === "Menengah" },
  { key: "mahir", label: "Mahir", matchCourse: (c) => c.level === "Mahir" },
];

function normalizeRadarValues(rawValues: number[]): RadarAxisDatum[] {
  const max = Math.max(...rawValues, 1);
  return RADAR_AXES.map((axis, index) => {
    const raw = rawValues[index] ?? 0;
    const value = Math.round((raw / max) * 100);
    return { key: axis.key, label: axis.label, raw, value: Math.max(value, 8) };
  });
}

/** Platform-wide interest map from catalog courses + mentor coverage. */
export function computePlatformRadarData(
  courses: Course[],
  mentors: Mentor[]
): RadarAxisDatum[] {
  const mentorInstrumentCoverage = (instrument: Instrument) =>
    mentors.filter((m) => m.instruments.includes(instrument)).length;

  const rawValues = RADAR_AXES.map((axis) => {
    const matched = courses.filter(axis.matchCourse);
    const courseCount = matched.length;
    const enrollment = matched.reduce((sum, c) => sum + c.studentsCount, 0);

    if (axis.key === "saham" || axis.key === "crypto" || axis.key === "forex") {
      const instrument = axis.label as Instrument;
      const mentorBoost = mentorInstrumentCoverage(instrument) * 4;
      return courseCount * 12 + enrollment + mentorBoost;
    }

    return courseCount * 14 + enrollment;
  });

  return normalizeRadarValues(rawValues);
}

/** Per-user learning spread from enrollments + lesson progress. */
export function computeUserRadarData(
  courses: Course[],
  progressBySlug: Map<string, LearningCourseProgress>
): RadarAxisDatum[] | null {
  if (progressBySlug.size === 0) return null;

  const enrolledCourses = courses.filter((c) => progressBySlug.has(c.slug));
  if (enrolledCourses.length === 0) return null;

  const rawValues = RADAR_AXES.map((axis) => {
    const matched = enrolledCourses.filter(axis.matchCourse);
    if (matched.length === 0) return 0;

    const totalProgress = matched.reduce((sum, course) => {
      const progress = progressBySlug.get(course.slug);
      return sum + (progress?.progressPercent ?? 0);
    }, 0);

    return totalProgress / matched.length;
  });

  const hasSignal = rawValues.some((v) => v > 0);
  if (!hasSignal) return null;

  return RADAR_AXES.map((axis, index) => ({
    key: axis.key,
    label: axis.label,
    raw: rawValues[index] ?? 0,
    value: Math.round(rawValues[index] ?? 0),
  }));
}

export function getRadarDataSourceLabel(source: RadarDataSource): string {
  return source === "user" ? "Progres belajarmu" : "Statistik katalog platform";
}
