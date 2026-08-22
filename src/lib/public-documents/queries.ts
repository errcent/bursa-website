import type { DocumentPortal } from "@prisma/client";

import {
  privacyPublicUrl,
  termsPublicUrl,
  trustPublicUrl,
  type LegalLocale,
} from "@/lib/hosts/hosts";
import { db } from "@/lib/db";

import { loadAllVaultDocuments } from "./parse-vault";
import type { PortalNavItem, PublicDocumentRecord } from "./types";

const STALE_DRAFT_BANNER = /> \*\*Catatan:\*\*[\s\S]*?\*\*DRAFT\*\*/i;

function hasStaleDraftBanner(body: string): boolean {
  return STALE_DRAFT_BANNER.test(body);
}

function mergeWithBundledWhenStale(
  dbDoc: PublicDocumentRecord,
  bundled: PublicDocumentRecord | undefined
): PublicDocumentRecord {
  if (!bundled || !hasStaleDraftBanner(dbDoc.markdownBody)) return dbDoc;
  if (hasStaleDraftBanner(bundled.markdownBody)) return dbDoc;

  return {
    ...dbDoc,
    title: bundled.title,
    eyebrow: bundled.eyebrow,
    description: bundled.description,
    markdownBody: bundled.markdownBody,
    sourceVaultPath: bundled.sourceVaultPath,
    sortOrder: bundled.sortOrder,
  };
}

function toRecord(
  d: {
    slug: string;
    portal: DocumentPortal;
    locale?: string;
    title: string;
    eyebrow: string;
    description: string;
    markdownBody: string;
    sortOrder: number;
    sourceVaultPath: string | null;
  },
  idPrefix: string
): PublicDocumentRecord {
  const locale: LegalLocale = d.locale === "en" ? "en" : "id";
  return {
    id: `${idPrefix}-${d.portal}-${locale}-${d.slug}`,
    slug: d.slug,
    portal: d.portal,
    locale,
    title: d.title,
    eyebrow: d.eyebrow,
    description: d.description,
    markdownBody: d.markdownBody,
    status: "PUBLISHED",
    version: 1,
    publishedAt: new Date(),
    sourceVaultPath: d.sourceVaultPath,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };
}

function withLocale(doc: Omit<PublicDocumentRecord, "locale"> & { locale?: string }): PublicDocumentRecord {
  return { ...doc, locale: doc.locale === "en" ? "en" : "id" };
}

async function loadVaultFallback(
  portal: DocumentPortal,
  slug?: string,
  locale: LegalLocale = "id"
): Promise<PublicDocumentRecord[]> {
  const vaultDocs = await loadAllVaultDocuments();
  const filtered = vaultDocs.filter(
    (d) =>
      d.portal === portal &&
      (slug ? d.slug === slug : true) &&
      d.locale === locale
  );

  return filtered.map((d) => toRecord(d, "vault"));
}

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function getPublishedDocument(
  portal: DocumentPortal,
  slug: string,
  locale: LegalLocale = "id"
): Promise<PublicDocumentRecord | null> {
  const doc = await tryDb(() =>
    db.publicDocument.findFirst({
      where: { portal, slug, locale, status: "PUBLISHED" },
    })
  );
  const bundled = (await loadVaultFallback(portal, slug, locale))[0];
  if (doc) return mergeWithBundledWhenStale(withLocale(doc), bundled);

  if (locale === "en") {
    return getPublishedDocument(portal, slug, "id");
  }

  return bundled ?? null;
}

export async function getDocumentForPreview(
  portal: DocumentPortal,
  slug: string,
  locale: LegalLocale = "id"
): Promise<PublicDocumentRecord | null> {
  const doc = await tryDb(() =>
    db.publicDocument.findFirst({
      where: { portal, slug, locale, status: { not: "ARCHIVED" } },
    })
  );
  const bundled = (await loadVaultFallback(portal, slug, locale))[0];
  if (doc) return mergeWithBundledWhenStale(withLocale(doc), bundled);
  if (locale === "en") return getDocumentForPreview(portal, slug, "id");
  return bundled ?? null;
}

export async function getPortalDocuments(
  portal: DocumentPortal,
  publishedOnly = true,
  locale: LegalLocale = "id"
): Promise<PublicDocumentRecord[]> {
  const docs = await tryDb(() =>
    db.publicDocument.findMany({
      where: publishedOnly
        ? { portal, locale, status: "PUBLISHED" }
        : { portal, locale, status: { not: "ARCHIVED" } },
      orderBy: { sortOrder: "asc" },
    })
  );

  const bundled = await loadVaultFallback(portal, undefined, locale);
  const bundledBySlug = new Map(bundled.map((d) => [d.slug, d]));

  if (docs && docs.length > 0) {
    return docs.map((doc) => mergeWithBundledWhenStale(withLocale(doc), bundledBySlug.get(doc.slug)));
  }

  if (locale === "en" && bundled.length === 0) {
    return getPortalDocuments(portal, publishedOnly, "id");
  }

  return bundled;
}

export function publicHrefForDocument(
  portal: DocumentPortal,
  slug: string,
  locale: LegalLocale = "id"
): string {
  if (portal === "PRIVACY") return privacyPublicUrl(slug, locale);
  if (portal === "TRUST") return trustPublicUrl(slug, locale);
  return termsPublicUrl(slug === "hub" ? "terms" : slug, locale);
}

export async function getPortalNav(
  portal: DocumentPortal,
  locale: LegalLocale = "id"
): Promise<PortalNavItem[]> {
  const docs = await getPortalDocuments(portal, true, locale);

  return docs
    .filter((d) => d.slug !== "hub")
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      href: publicHrefForDocument(portal, d.slug, locale),
      sortOrder: d.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getHubDocument(
  portal: DocumentPortal,
  locale: LegalLocale = "id"
): Promise<PublicDocumentRecord | null> {
  if (portal === "LEGAL") {
    return getPublishedDocument(portal, "terms", locale);
  }
  return getPublishedDocument(portal, "hub", locale);
}
