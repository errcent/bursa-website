import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DocumentPortal } from "@prisma/client";

import { InfoPageHero } from "@/components/info-page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { DsarRequestForm } from "@/components/trust-portal/dsar-form";
import { PortalJsonLd } from "@/components/trust-portal/portal-jsonld";
import { PortalMobileNav } from "@/components/trust-portal/portal-mobile-nav";
import {
  PortalDocShell,
  PortalHubContent,
} from "@/components/trust-portal/portal-layout";
import {
  getHubDocument,
  getPortalNav,
  getPublishedDocument,
} from "@/lib/public-documents/queries";
import { PORTAL_ROUTE, ROUTE_PORTAL, type PortalSlug } from "@/lib/public-documents/types";

export const revalidate = 3600;

const PORTAL_META: Record<
  PortalSlug,
  { label: string; heroTitle: string; heroDescription: string }
> = {
  privasi: {
    label: "Pusat Privasi",
    heroTitle: "Pusat Privasi",
    heroDescription:
      "Pelajari bagaimana Bursa mengumpulkan, menggunakan, dan melindungi data pribadimu.",
  },
  kepercayaan: {
    label: "Pusat Kepercayaan",
    heroTitle: "Pusat Kepercayaan",
    heroDescription:
      "Transparansi keamanan, kontrol kepatuhan, dan praktik perlindungan data Bursa.",
  },
};

const CROSS_LINKS: Record<PortalSlug, { href: string; label: string }> = {
  privasi: { href: "/kepercayaan", label: "Pusat Kepercayaan" },
  kepercayaan: { href: "/privasi", label: "Pusat Privasi" },
};

export async function generatePortalMetadata(
  portalSlug: PortalSlug,
  docSlug?: string
): Promise<Metadata> {
  const portal = ROUTE_PORTAL[portalSlug];
  const meta = PORTAL_META[portalSlug];

  if (!docSlug || docSlug === "hub") {
    const hub = await getHubDocument(portal);
    return {
      title: hub?.title ?? meta.heroTitle,
      description: hub?.description ?? meta.heroDescription,
    };
  }

  const doc = await getPublishedDocument(portal, docSlug);
  if (!doc) return { title: meta.heroTitle };

  return {
    title: doc.title,
    description: doc.description,
  };
}

export async function renderPortalPage(portalSlug: PortalSlug, docSlug?: string) {
  const portal: DocumentPortal = ROUTE_PORTAL[portalSlug];
  const meta = PORTAL_META[portalSlug];
  const portalBase = PORTAL_ROUTE[portal];
  const navItems = await getPortalNav(portal);

  const isHub = !docSlug || docSlug === "hub";

  if (isHub) {
    const hubDoc = await getHubDocument(portal);
    if (!hubDoc) notFound();

    return (
      <>
        <PortalJsonLd
          portalSlug={portalSlug}
          title={hubDoc.title}
          description={hubDoc.description}
          path={`/${portalBase}`}
        />
        <SiteNavbar />
        <main className="flex-1">
          <InfoPageHero
            eyebrow={hubDoc.eyebrow || meta.label}
            title={hubDoc.title}
            description={hubDoc.description}
          />
          <div className="container-page section-spacious">
            <Link href="/" className="link-muted mb-6 inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" />
              Kembali
            </Link>
            <PortalMobileNav
              portalBase={portalBase}
              portalLabel={meta.label}
              navItems={navItems}
              activeSlug="hub"
            />
            <PortalHubContent
              hubDoc={hubDoc}
              navItems={navItems}
              portalBase={portalBase}
              crossLink={CROSS_LINKS[portalSlug]}
            />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const doc = await getPublishedDocument(portal, docSlug);
  if (!doc) notFound();

  const showDsar = portalSlug === "privasi" && docSlug === "permintaan-data";

  return (
    <>
      <PortalJsonLd
        portalSlug={portalSlug}
        title={doc.title}
        description={doc.description}
        path={`/${portalBase}/${docSlug}`}
      />
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero eyebrow={doc.eyebrow || meta.label} title={doc.title} description={doc.description} />
        <div className="container-page section-spacious">
          <Link
            href={`/${portalBase}`}
            className="link-muted mb-6 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-4" />
            {meta.label}
          </Link>
          <PortalDocShell
            doc={doc}
            navItems={navItems}
            portalBase={portalBase}
            portalLabel={meta.label}
          >
            {showDsar && <DsarRequestForm />}
          </PortalDocShell>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function portalStaticParams(portalSlug: PortalSlug): { slug?: string[] }[] {
  const privasiSlugs = ["kebijakan", "cookie", "sub-prosesor", "permintaan-data", "faq"];
  const kepercayaanSlugs = ["keamanan", "kontrol", "kepatuhan", "pelaporan", "sumber-daya", "faq"];
  const slugs = portalSlug === "privasi" ? privasiSlugs : kepercayaanSlugs;
  return [{ slug: undefined }, ...slugs.map((s) => ({ slug: [s] }))];
}
