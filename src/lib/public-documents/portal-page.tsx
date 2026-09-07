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
import { PrivacyDocContent, PrivacyPortalExtras } from "@/components/trust-portal/privacy/privacy-doc-content";
import { PrivacyPolicyShell } from "@/components/trust-portal/privacy/privacy-policy-shell";
import { PrivacyPortalHero } from "@/components/trust-portal/privacy/privacy-portal-hero";
import { PrivacySkipLinks } from "@/components/trust-portal/privacy/privacy-portal-hero";
import { TrustChrome } from "@/components/trust-portal/trust/trust-chrome";
import { TrustFooter, TrustPageHeader, TrustSkipLinks } from "@/components/trust-portal/trust/trust-shell";
import { TrustControls } from "@/components/trust-portal/trust/trust-controls";
import { TrustDocArticle } from "@/components/trust-portal/trust/trust-doc";
import { TrustHero } from "@/components/trust-portal/trust/trust-hero";
import { TrustOverview } from "@/components/trust-portal/trust/trust-overview";
import { TrustResources } from "@/components/trust-portal/trust/trust-resources";
import { tabForTrustSlug } from "@/lib/trust/public-posture";
import {
  GOVERNING_LANGUAGE_EN,
  GOVERNING_LANGUAGE_ID,
  internalPrivacyPath,
  internalTermsPath,
  internalTrustPath,
  isProductionHostRouting,
  legalHrefsFor,
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
      heroTitle: "Data yang kami kumpulkan, bagaimana kami menggunakannya, dan dengan siapa kami membagikannya",
      heroDescription:
        "Pelajari bagaimana Bursa mengumpulkan, menggunakan, dan melindungi data pribadimu — serta bagaimana kamu mengendalikan hak-hakmu.",
    },
    en: {
      label: "Privacy Center",
      heroTitle: "The data we collect, how we use it, and who we share it with",
      heroDescription:
        "Learn how Bursa collects, uses, and protects your personal data — and how you control your rights.",
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
  if (!isProductionHostRouting()) {
    if (portalSlug === "privasi") return internalPrivacyPath(internalSlug, locale);
    if (portalSlug === "kepercayaan") return internalTrustPath(internalSlug, locale);
    return internalTermsPath(internalSlug, locale);
  }
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
  const hrefs = legalHrefsFor(locale);
  if (portalSlug === "privasi") {
    return {
      href: hrefs.trust,
      label: locale === "en" ? "Trust Center" : "Pusat Kepercayaan",
    };
  }
  if (portalSlug === "kepercayaan") {
    return {
      href: hrefs.privacy,
      label: locale === "en" ? "Privacy Center" : "Pusat Privasi",
    };
  }
  return {
    href: hrefs.privacyPolicy,
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
  const governing = locale === "en" ? GOVERNING_LANGUAGE_EN : GOVERNING_LANGUAGE_ID;
  const backLabel = locale === "en" ? "Back to Bursanalar" : "Kembali ke Bursanalar";

  const isPrivacy = portalSlug === "privasi";
  const isTrust = portalSlug === "kepercayaan";
  const chromeVariant = isPrivacy ? "privacy" : "default";

  if (isTrust) {
    return renderTrustPortalPage({
      portalSlug,
      portal,
      docSlug,
      locale,
      isHub,
      idHref,
      enHref,
    });
  }

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
        {isPrivacy && <PrivacySkipLinks locale={locale} />}
        <PortalChrome locale={locale} idHref={idHref} enHref={enHref} variant={chromeVariant} />
        <main className="flex-1">
          {isPrivacy ? (
            <PrivacyPortalHero locale={locale} title={hubDoc.title} description={hubDoc.description} />
          ) : (
            <InfoPageHero
              eyebrow={hubDoc.eyebrow || meta.label}
              title={hubDoc.title}
              description={hubDoc.description}
            />
          )}
          <div className={isPrivacy ? "container-page pb-16 pt-2" : "container-page section-spacious pb-16"}>
            {!isPrivacy && (
              <Link href={originApex()} className="link-muted mb-6 inline-flex items-center gap-1.5">
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
            )}
            <p className="mb-8 text-xs text-muted-foreground">{governing}</p>
            {isPrivacy ? (
              <PrivacyPolicyShell>
                <PortalHubContent
                  hubDoc={hubDoc}
                  navItems={navItems}
                  portalBase=""
                  crossLink={crossLink(portalSlug, locale)}
                  locale={locale}
                />
              </PrivacyPolicyShell>
            ) : isTerms ? (
              <PortalDocShell
                doc={hubDoc}
                navItems={navItems}
                hubHref={publicHrefForDocument(portal, "terms", locale)}
                portalLabel={meta.label}
                locale={locale}
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
        <PortalFooter locale={locale} variant={chromeVariant} />
        {isPrivacy && <PrivacyPortalExtras locale={locale} />}
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
      {isPrivacy && <PrivacySkipLinks locale={locale} />}
      <PortalChrome locale={locale} idHref={idHref} enHref={enHref} variant={chromeVariant} />
      <main className="flex-1">
        {isPrivacy ? (
          <PrivacyPortalHero locale={locale} title={doc.title} description={doc.description} />
        ) : (
          <InfoPageHero eyebrow={doc.eyebrow || meta.label} title={doc.title} description={doc.description} />
        )}
        <div className={isPrivacy ? "container-page pb-16 pt-2" : "container-page section-spacious pb-16"}>
          {!isPrivacy && (
            <Link href={hubHref} className="link-muted mb-6 inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" />
              {meta.label}
            </Link>
          )}
          <p className="mb-8 text-xs text-muted-foreground">{governing}</p>
          {isPrivacy ? (
            <PrivacyPolicyShell>
              <PrivacyDocContent
                doc={doc}
                navItems={navItems}
                hubHref={hubHref}
                portalLabel={meta.label}
                locale={locale}
              />
            </PrivacyPolicyShell>
          ) : (
            <PortalDocShell
              doc={doc}
              navItems={navItems}
              hubHref={hubHref}
              portalLabel={meta.label}
              locale={locale}
            >
              {showDsar && <DsarRequestForm locale={locale} />}
            </PortalDocShell>
          )}
        </div>
      </main>
      <PortalFooter locale={locale} variant={chromeVariant} />
      {isPrivacy && <PrivacyPortalExtras locale={locale} />}
    </>
  );
}

function trustNavHrefs(locale: LegalLocale) {
  const resources = publicPathFor("kepercayaan", "sumber-daya", locale);
  return {
    hub: publicPathFor("kepercayaan", "hub", locale),
    controls: publicPathFor("kepercayaan", "kontrol", locale),
    resources,
    request: `${resources}#request`,
  };
}

async function renderTrustPortalPage({
  portalSlug,
  portal,
  docSlug,
  locale,
  isHub,
  idHref,
  enHref,
}: {
  portalSlug: PortalSlug;
  portal: DocumentPortal;
  docSlug: string | undefined;
  locale: LegalLocale;
  isHub: boolean;
  idHref: string;
  enHref: string;
}) {
  const activeTab = tabForTrustSlug(isHub ? "hub" : docSlug);
  const jsonLdSlug = isHub ? "hub" : docSlug ?? "hub";

  if (isHub) {
    const hubDoc = await getHubDocument(portal, locale);
    if (!hubDoc) notFound();
    return (
      <>
        <PortalJsonLd
          portalSlug={portalSlug}
          title={hubDoc.title}
          description={hubDoc.description}
          url={publicUrlFor(portalSlug, "hub", locale)}
          locale={locale}
        />
        <TrustSkipLinks locale={locale} />
        <TrustChrome
          locale={locale}
          idHref={idHref}
          enHref={enHref}
          activeTab={activeTab}
          hrefs={trustNavHrefs(locale)}
        />
        <main id="trust-main" className="flex-1">
          <TrustHero locale={locale} />
          <div className="container-page pt-10">
            <TrustOverview locale={locale} />
          </div>
        </main>
        <TrustFooter locale={locale} />
      </>
    );
  }

  if (!docSlug) notFound();
  const doc = await getPublishedDocument(portal, docSlug, locale);
  if (!doc) notFound();

  return (
    <>
      <PortalJsonLd
        portalSlug={portalSlug}
        title={doc.title}
        description={doc.description}
        url={publicUrlFor(portalSlug, jsonLdSlug, locale)}
        locale={locale}
      />
      <TrustSkipLinks locale={locale} />
      <TrustChrome
        locale={locale}
        idHref={idHref}
        enHref={enHref}
        activeTab={activeTab}
        hrefs={trustNavHrefs(locale)}
      />
      <main id="trust-main" className="flex-1">
        {docSlug === "kontrol" ? (
          <>
            <TrustPageHeader title={doc.title} description={doc.description} />
            <div className="container-page pb-16 pt-8">
              <TrustControls locale={locale} />
            </div>
          </>
        ) : docSlug === "sumber-daya" ? (
          <>
            <TrustPageHeader title={doc.title} description={doc.description} />
            <div className="container-page pb-16 pt-8">
              <TrustResources locale={locale} />
            </div>
          </>
        ) : (
          <TrustDocArticle doc={doc} locale={locale} />
        )}
      </main>
      <TrustFooter locale={locale} />
    </>
  );
}

function originApex(): string {
  return "https://bursanalar.com/";
}

export function portalStaticParams(portalSlug: PortalSlug): { slug?: string[] }[] {
  const privasiSlugs = [
    "kebijakan",
    "cookie",
    "sub-prosesor",
    "permintaan-data",
    "permintaan-status",
    "cara-kerja",
    "faq",
  ];
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
