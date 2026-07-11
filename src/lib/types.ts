export type Instrument = "Saham" | "Crypto" | "Forex";

export type Level = "Pemula" | "Menengah" | "Mahir";

export interface Mentor {
  slug: string;
  name: string;
  title: string;
  initials: string;
  avatarUrl?: string;
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

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  preview?: boolean;
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
  outcomes: string[];
  modules: Module[];
  /** Set on listing queries that skip module payloads. */
  moduleCount?: number;
}

export interface FounderProfile {
  name: string;
  role: string;
  initials: string;
}

export interface FounderResponse {
  id: string;
  topic: string;
  response: string;
}

export interface Review {
  name: string;
  initials: string;
  rating: number;
  comment: string;
  date: string;
}
