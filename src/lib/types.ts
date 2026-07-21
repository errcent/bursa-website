export type Instrument = "Saham" | "Crypto" | "Forex";

export type Level = "Pemula" | "Menengah" | "Mahir";

export interface Mentor {
  slug: string;
  name: string;
  title: string;
  initials: string;
  avatarUrl?: string;
  /** Waist-up cutout artwork (transparent background) used on the Mentor Stage carousel. */
  cutoutUrl?: string;
  instruments: Instrument[];
  verified: boolean;
  licenseLabel?: string;
  yearsExperience: number;
  studentsCount: number;
  coursesCount: number;
  rating: number;
  bio: string;
  philosophy: string;
  trackRecord: number[];
  availableFor1on1: boolean;
  sessionPrice?: string;
}

export interface LessonMaterial {
  id: string;
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  preview?: boolean;
  /** Downloadable files (PDF, template, cheat sheet) attached to this lesson. */
  materials?: LessonMaterial[];
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: string;
  mentorSlug: string;
  instrument: Instrument;
  level: Level;
  price: number;
  rating: number;
  studentsCount: number;
  durationHours: number;
  shortDescription: string;
  thumbnailUrl?: string;
  outcomes: string[];
  modules: Module[];
  /** Prisma Module (section) count — admin/internal; not shown to learners. */
  moduleCount?: number;
  /** Total video count — listing queries aggregate lessons across modules. */
  lessonCount?: number;
  /** ISO date for "Baru di Bursa" catalog row. */
  createdAt?: string;
  /** Number of (non-flagged) reviews behind `rating` — shown as "(n)" and used for min-sample. */
  ratingCount?: number;
  /** Bayesian-shrunk rating used for ranking (QC-20260719-17). */
  bayesianRating?: number;
  /** Time-decayed rating used for staleness signalling (QC-20260719-18). */
  decayedRating?: number;
  /** Distinct COMPLETED paid buyers — popularity signal for ranking (QC-20260719-27). */
  paidStudentsCount?: number;
  /** ISO date content was last materially updated — staleness penalty input (QC-20260719-18). */
  contentUpdatedAt?: string;
}

export interface Review {
  name: string;
  initials: string;
  rating: number;
  comment: string;
  date: string;
  /** Course title the reviewer took — surfaced as a tag on the review card. */
  courseTag?: string;
  /** Mentor name the reviewer studied with — surfaced as a tag on the review card. */
  mentorTag?: string;
}
