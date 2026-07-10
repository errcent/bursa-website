import type { Instrument } from "@/lib/types";

export type MentorApplicationStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface MentorApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  professionalTitle: string;
  instruments: Instrument[];
  yearsExperience: number;
  licenseLabel?: string;
  bio: string;
  philosophy: string;
  portfolioUrl?: string;
  hasExistingContent: boolean;
  estimatedCoursePrice?: number;
  agreedToTerms: boolean;
  status: MentorApplicationStatus;
  createdAt: string;
}

export interface MentorApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  professionalTitle: string;
  instruments: Instrument[];
  yearsExperience: number;
  licenseLabel?: string;
  bio: string;
  philosophy: string;
  portfolioUrl?: string;
  hasExistingContent: boolean;
  estimatedCoursePrice?: number;
  agreedToTerms: boolean;
}

const applications: MentorApplication[] = [];

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createMentorApplication(input: MentorApplicationInput): MentorApplication {
  const application: MentorApplication = {
    id: generateId(),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  applications.push(application);
  return application;
}

export function getMentorApplications(): MentorApplication[] {
  return [...applications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getMentorApplicationById(id: string): MentorApplication | undefined {
  return applications.find((app) => app.id === id);
}
