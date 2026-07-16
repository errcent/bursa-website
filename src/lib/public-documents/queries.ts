import type { DocumentPortal } from "@prisma/client";

import { db } from "@/lib/db";

import { loadAllVaultDocuments } from "./parse-vault";
import type { PortalNavItem, PublicDocumentRecord } from "./types";
import { PORTAL_ROUTE } from "./types";

function mapRecord(doc: {
  id: string;
  slug: string;
  portal: DocumentPortal;
  title: string;
  eyebrow: string;
  description: string;
  markdownBody: string;
  status: PublicDocumentRecord["status"];
  version: number;
  publishedAt: Date | null;
  sourceVaultPath: string | null;
  sortOrder: number;
  updatedAt: Date;
}): PublicDocumentRecord {
  return doc;
}

async function loadVaultFallback(
  portal: DocumentPortal,
  slug?: string
): Promise<PublicDocumentRecord[]> {
  const vaultDocs = await loadAllVaultDocuments();
  const filtered = vaultDocs.filter((d) => d.portal === portal && (slug ? d.slug === slug : true));

  return filtered.map((d, i) => ({
    id: `vault-${portal}-${d.slug}`,
    slug: d.slug,
    portal: d.portal,
    title: d.title,
    eyebrow: d.eyebrow,
    description: d.description,
    markdownBody: d.markdownBody,
    status: "PUBLISHED" as const,
    version: 1,
    publishedAt: new Date(),
    sourceVaultPath: d.sourceVaultPath,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  }));
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
  slug: string
): Promise<PublicDocumentRecord | null> {
  const doc = await tryDb(() =>
    db.publicDocument.findFirst({
      where: { portal, slug, status: "PUBLISHED" },
    })
  );
  if (doc) return mapRecord(doc);

  const fallback = await loadVaultFallback(portal, slug);
  return fallback[0] ?? null;
}

export async function getDocumentForPreview(
  portal: DocumentPortal,
  slug: string
): Promise<PublicDocumentRecord | null> {
  const doc = await tryDb(() =>
    db.publicDocument.findFirst({
      where: { portal, slug, status: { not: "ARCHIVED" } },
    })
  );
  if (doc) return mapRecord(doc);

  const fallback = await loadVaultFallback(portal, slug);
  return fallback[0] ?? null;
}

export async function getPortalDocuments(
  portal: DocumentPortal,
  publishedOnly = true
): Promise<PublicDocumentRecord[]> {
  const docs = await tryDb(() =>
    db.publicDocument.findMany({
      where: publishedOnly
        ? { portal, status: "PUBLISHED" }
        : { portal, status: { not: "ARCHIVED" } },
      orderBy: { sortOrder: "asc" },
    })
  );
  if (docs && docs.length > 0) return docs.map(mapRecord);

  return loadVaultFallback(portal);
}

export async function getPortalNav(portal: DocumentPortal): Promise<PortalNavItem[]> {
  const docs = await getPortalDocuments(portal);
  const base = PORTAL_ROUTE[portal];

  return docs
    .filter((d) => d.slug !== "hub")
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      href: `/${base}/${d.slug}`,
      sortOrder: d.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getHubDocument(portal: DocumentPortal): Promise<PublicDocumentRecord | null> {
  return getPublishedDocument(portal, "hub");
}
