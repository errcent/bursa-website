import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DocumentPortal } from "@prisma/client";

import { InfoPageHero } from "@/components/info-page-hero";
import { DsarRequestForm } from "@/components/trust-portal/dsar-form";
import { PortalJsonLd } from "@/components/trust-portal/portal-jsonld";
import { PortalChrome, PortalFooter } from "@/components/trust-portal/portal-chrome";
import {
  PortalDocShell,
  PortalHubContent,
} from "@/components/trust-portal/portal-layout";
import {
  GOVERNING_LANGUAGE_EN,
  GOVERNING_LANGUAGE_ID,
  LEGAL_HREFS,
  privacyPublicPath,
  privacyPublicUrl,
  termsPublicPath,
  termsPublicUrl,
  trustPublicPath,
  trustPublicUrl,
  type LegalLocale,
} from "@/lib/hosts/hosts";
import {
  getHubDocument,
  getPortalNav,
  getPublishedDocument,
  publicHrefForDocument,
} from "@/lib/public-documents/queries";
import { ROUTE_PORTAL, type PortalSlug } from "@/lib/public-documents/types";

export const revalidate = 3600;

const PORTAL_META: Record<
  PortalSlug,
  Record<LegalLocale, { label: string; heroTitle: string; heroDescription: string }>
> = {
  privasi: {
    id: {
      label: "Pusat Privasi",
      heroTitle: "Pusat Privasi",
      heroDescription:
        "Pelajari bagaimana Bursa mengumpulkan, menggunakan, dan melindungi data pribadimu.",
    },
    en: {
      label: "Privacy Center",
      heroTitle: "Privacy Center",
      heroDescription: "How Bursa collects, uses, and protects your personal data.",
    },
  },
  kepercayaan: {
    id: {
      label: "Pusat Kepercayaan",
      heroTitle: "Pusat Kepercayaan",
      heroDescription: "Transparansi keamanan, kontrol kepatuhan, dan praktik perlindungan data Bursa.",
    },
    en: {
      label: "Trust Center",
      heroTitle: "Trust Center",
      heroDescription: "Security controls, compliance, and how we protect learner data.",
    },
  },
  terms: {
    id: {
      label: "Syarat & Ketentuan",
      heroTitle: "Syarat & Ketentuan",
      heroDescription: "Ketentuan penggunaan platform Bursa.",
    },
    en: {
      label: "Terms of Service",
      heroTitle: "Terms of Service",
      heroDescription: "Terms that govern your use of the Bursa platform.",
    },
  },
};

function publicPathFor(portalSlug: PortalSlug, internalSlug: string, locale: LegalLocale): string {
  if (portalSlug === "privasi") return privacyPublicPath(internalSlug, locale);
  if (portalSlug === "kepercayaan") return trustPublicPath(internalSlug, locale);
  return termsPublicPath(internalSlug, locale);
}

function publicUrlFor(portalSlug: PortalSlug, internalSlug: string, locale: LegalLocale): string {
  if (portalSlug === "privasi") return privacyPublicUrl(internalSlug, locale);
  if (portalSlug === "kepercayaan") return trustPublicUrl(internalSlug, locale);
  return termsPublicUrl(internalSlug, locale);
}

function crossLink(
  portalSlug: PortalSlug,
  locale: LegalLocale
): { href: string; label: string } {
  if (portalSlug === "privasi") {
    return {
      href: LEGAL_HREFS.trust,
      label: locale === "en" ? "Trust Center" : "Pusat Kepercayaan",
    };
  }
  if (portalSlug === "kepercayaan") {
    return {
      href: LEGAL_HREFS.privacy,
      label: locale === "en" ? "Privacy Center" : "Pusat Privasi",
    };
  }
  return {
    href: LEGAL_HREFS.privacy,
    label: locale === "en" ? "Privacy Policy" : "Kebijakan Privasi",
  };
}

export async function generatePortalMetadata(
  portalSlug: PortalSlug,
  docSlug: string | undefined,
  locale: LegalLocale = "id"
): Promise<Metadata> {
  const portal = ROUTE_PORTAL[portalSlug];
  const meta = PORTAL_META[portalSlug][locale];
  const canonicalSlug = !docSlug || docSlug === "hub" ? (portalSlug === "terms" ? "terms" : "hub") : docSlug;

  const doc =
    canonicalSlug === "hub" || (portalSlug === "terms" && canonicalSlug === "terms")
      ? await getHubDocument(portal, locale)
      : await getPublishedDocument(portal, canonicalSlug, locale);

  const canonical = publicUrlFor(portalSlug, canonicalSlug === "hub" ? "hub" : canonicalSlug, locale);
  const languages = {
    id: publicUrlFor(portalSlug, canonicalSlug === "hub" ? "hub" : canonicalSlug, "id"),
    en: publicUrlFor(portalSlug, canonicalSlug === "hub" ? "hub" : canonicalSlug, "en"),
  };

  return {
    title: doc?.title ?? meta.heroTitle,
    description: doc?.description ?? meta.heroDescription,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: doc?.title ?? meta.heroTitle,
      description: doc?.description ?? meta.heroDescription,
      url: canonical,
      locale: locale === "en" ? "en_US" : "id_ID",
    },
    robots: { index: true, follow: true },
  };
}

export async function renderPortalPage(
  portalSlug: PortalSlug,
  docSlug: string | undefined,
  locale: LegalLocale = "id"
) {
  const portal: DocumentPortal = ROUTE_PORTAL[portalSlug];
  const meta = PORTAL_META[portalSlug][locale];
  const navItems = await getPortalNav(portal, locale);
  const isTerms = portalSlug === "terms";
  const isHub = !docSlug || docSlug === "hub" || (isTerms && (docSlug === "terms" || !docSlug));
  const internalSlug = isHub ? (isTerms ? "terms" : "hub") : docSlug;
  const idHref = publicPathFor(portalSlug, internalSlug, "id");
  const enHref = publicPathFor(portalSlug, internalSlug, "en");
  const backLabel = locale === "en" ? "Back" : "Kembali";
  const governing = locale === "en" ? GOVERNING_LANGUAGE_EN : GOVERNING_LANGUAGE_ID;

  if (isHub) {
    const hubDoc = await getHubDocument(portal, locale);
    if (!hubDoc) notFound();

    return (
      <>
        <PortalJsonLd
          portalSlug={portalSlug}
          title={hubDoc.title}
          description={hubDoc.description}
          url={publicUrlFor(portalSlug, internalSlug, locale)}
          locale={locale}
        />
        <PortalChrome locale={locale} idHref={idHref} enHref={enHref} />
        <main className="flex-1">
          <InfoPageHero
            eyebrow={hubDoc.eyebrow || meta.label}
            title={hubDoc.title}
            description={hubDoc.description}
          />
          <div className="container-page section-spacious pb-16">
            <Link href={originApex()} className="link-muted mb-6 inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
            <p className="mb-8 text-xs text-muted-foreground">{governing}</p>
            {isTerms ? (
              <PortalDocShell
                doc={hubDoc}
                navItems={navItems}
                hubHref={publicHrefForDocument(portal, "terms", locale)}
                portalLabel={meta.label}
              />
            ) : (
              <PortalHubContent
                hubDoc={hubDoc}
                navItems={navItems}
                portalBase=""
                crossLink={crossLink(portalSlug, locale)}
                locale={locale}
              />
            )}
          </div>
        </main>
        <PortalFooter locale={locale} />
      </>
    );
  }

  const doc = await getPublishedDocument(portal, docSlug, locale);
  if (!doc) notFound();

  const showDsar = portalSlug === "privasi" && docSlug === "permintaan-data";
  const hubHref = publicHrefForDocument(portal, isTerms ? "terms" : "hub", locale);

  return (
    <>
      <PortalJsonLd
        portalSlug={portalSlug}
        title={doc.title}
        description={doc.description}
        url={publicUrlFor(portalSlug, docSlug, locale)}
        locale={locale}
      />
      <PortalChrome locale={locale} idHref={idHref} enHref={enHref} />
      <main className="flex-1">
        <InfoPageHero eyebrow={doc.eyebrow || meta.label} title={doc.title} description={doc.description} />
        <div className="container-page section-spacious pb-16">
          <Link href={hubHref} className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            {meta.label}
          </Link>
          <p className="mb-8 text-xs text-muted-foreground">{governing}</p>
          <PortalDocShell
            doc={doc}
            navItems={navItems}
            hubHref={hubHref}
            portalLabel={meta.label}
          >
            {showDsar && <DsarRequestForm />}
          </PortalDocShell>
        </div>
      </main>
      <PortalFooter locale={locale} />
    </>
  );
}

function originApex(): string {
  return "https://bursanalar.com/";
}

export function portalStaticParams(portalSlug: PortalSlug): { slug?: string[] }[] {
  const privasiSlugs = ["kebijakan", "cookie", "sub-prosesor", "permintaan-data", "faq"];
  const kepercayaanSlugs = ["keamanan", "kontrol", "kepatuhan", "pelaporan", "sumber-daya", "faq"];
  const termsSlugs = ["learner-guidelines"];
  const slugs =
    portalSlug === "privasi"
      ? privasiSlugs
      : portalSlug === "kepercayaan"
        ? kepercayaanSlugs
        : termsSlugs;
  const id = [{ slug: undefined }, ...slugs.map((s) => ({ slug: [s] }))];
  const en = [
    { slug: ["en"] },
    ...slugs.map((s) => ({ slug: ["en", s] })),
  ];
  return [...id, ...en];
}
