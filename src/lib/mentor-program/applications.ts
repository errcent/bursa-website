import type { MentorApplicationStatus as DbMentorApplicationStatus } from "@prisma/client";

import { db } from "@/lib/db";
import type { Instrument } from "@/lib/types";

export type MentorApplicationStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface MentorApplicationDocument {
  url: string;
  fileName: string;
}

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
  cvDocument?: MentorApplicationDocument;
  certificateDocument?: MentorApplicationDocument;
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
  cvDocumentUrl?: string;
  cvDocumentName?: string;
  certificateDocumentUrl?: string;
  certificateDocumentName?: string;
}

function statusFromDb(status: DbMentorApplicationStatus): MentorApplicationStatus {
  return status.toLowerCase() as MentorApplicationStatus;
}

function statusToDb(status: MentorApplicationStatus): DbMentorApplicationStatus {
  return status.toUpperCase() as DbMentorApplicationStatus;
}

function mapFromDb(row: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  professionalTitle: string;
  instruments: unknown;
  yearsExperience: number;
  licenseLabel: string | null;
  bio: string;
  philosophy: string;
  portfolioUrl: string | null;
  hasExistingContent: boolean;
  estimatedCoursePrice: number | null;
  agreedToTerms: boolean;
  cvDocumentUrl: string | null;
  cvDocumentName: string | null;
  certificateDocumentUrl: string | null;
  certificateDocumentName: string | null;
  status: DbMentorApplicationStatus;
  createdAt: Date;
}): MentorApplication {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    professionalTitle: row.professionalTitle,
    instruments: row.instruments as Instrument[],
    yearsExperience: row.yearsExperience,
    licenseLabel: row.licenseLabel ?? undefined,
    bio: row.bio,
    philosophy: row.philosophy,
    portfolioUrl: row.portfolioUrl ?? undefined,
    hasExistingContent: row.hasExistingContent,
    estimatedCoursePrice: row.estimatedCoursePrice ?? undefined,
    agreedToTerms: row.agreedToTerms,
    cvDocument:
      row.cvDocumentUrl && row.cvDocumentName
        ? { url: row.cvDocumentUrl, fileName: row.cvDocumentName }
        : undefined,
    certificateDocument:
      row.certificateDocumentUrl && row.certificateDocumentName
        ? { url: row.certificateDocumentUrl, fileName: row.certificateDocumentName }
        : undefined,
    status: statusFromDb(row.status),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createMentorApplication(
  input: MentorApplicationInput
): Promise<MentorApplication> {
  const row = await db.mentorApplication.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      professionalTitle: input.professionalTitle,
      instruments: input.instruments,
      yearsExperience: input.yearsExperience,
      licenseLabel: input.licenseLabel,
      bio: input.bio,
      philosophy: input.philosophy,
      portfolioUrl: input.portfolioUrl,
      hasExistingContent: input.hasExistingContent,
      estimatedCoursePrice: input.estimatedCoursePrice,
      agreedToTerms: input.agreedToTerms,
      cvDocumentUrl: input.cvDocumentUrl,
      cvDocumentName: input.cvDocumentName,
      certificateDocumentUrl: input.certificateDocumentUrl,
      certificateDocumentName: input.certificateDocumentName,
      status: statusToDb("pending"),
    },
  });

  return mapFromDb(row);
}

export async function getMentorApplications(): Promise<MentorApplication[]> {
  const rows = await db.mentorApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapFromDb);
}

export async function getMentorApplicationById(
  id: string
): Promise<MentorApplication | undefined> {
  const row = await db.mentorApplication.findUnique({ where: { id } });
  return row ? mapFromDb(row) : undefined;
}
