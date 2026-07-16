import type { DocumentPortal, DocumentStatus } from "@prisma/client";

export type PortalSlug = "privasi" | "kepercayaan";

export const PORTAL_ROUTE: Record<DocumentPortal, PortalSlug> = {
  PRIVACY: "privasi",
  TRUST: "kepercayaan",
  LEGAL: "privasi",
};

export const ROUTE_PORTAL: Record<PortalSlug, DocumentPortal> = {
  privasi: "PRIVACY",
  kepercayaan: "TRUST",
};

export interface PublicDocumentRecord {
  id: string;
  slug: string;
  portal: DocumentPortal;
  title: string;
  eyebrow: string;
  description: string;
  markdownBody: string;
  status: DocumentStatus;
  version: number;
  publishedAt: Date | null;
  sourceVaultPath: string | null;
  sortOrder: number;
  updatedAt: Date;
}

export interface ParsedVaultDocument {
  portal: DocumentPortal;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  sortOrder: number;
  markdownBody: string;
  sourceVaultPath: string;
}

export interface PortalNavItem {
  slug: string;
  title: string;
  description: string;
  href: string;
  sortOrder: number;
}
