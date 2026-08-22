import type { DocumentPortal, DocumentStatus } from "@prisma/client";

import type { LegalLocale } from "@/lib/hosts/hosts";

export type PortalSlug = "privasi" | "kepercayaan" | "terms";

export const PORTAL_ROUTE: Record<DocumentPortal, PortalSlug> = {
  PRIVACY: "privasi",
  TRUST: "kepercayaan",
  LEGAL: "terms",
};

export const ROUTE_PORTAL: Record<PortalSlug, DocumentPortal> = {
  privasi: "PRIVACY",
  kepercayaan: "TRUST",
  terms: "LEGAL",
};

export interface PublicDocumentRecord {
  id: string;
  slug: string;
  portal: DocumentPortal;
  locale: LegalLocale;
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
  locale: LegalLocale;
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
