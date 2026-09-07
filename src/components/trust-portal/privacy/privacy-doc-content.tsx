"use client";

import { Suspense } from "react";

import type { PortalNavItem, PublicDocumentRecord } from "@/lib/public-documents/types";
import type { LegalLocale } from "@/lib/hosts/hosts";

import { DsarRequestForm } from "../dsar-form";
import { MarkdownDocument, extractHeadings } from "../markdown-document";
import { PortalDocShell } from "../portal-layout";
import { CookiePreferenceCenter } from "./cookie-preference-center";
import { DsarStatusLookup } from "./dsar-status-lookup";
import { DsarWizardModal } from "./dsar-wizard-modal";
import { PrivacyActionBar } from "./privacy-action-bar";
import { PrivacySidebarToc } from "./privacy-sidebar-toc";

export function PrivacyPortalExtras({ locale }: { locale: LegalLocale }) {
  return (
    <Suspense fallback={null}>
      <DsarWizardModal locale={locale} />
    </Suspense>
  );
}

export function PrivacyDocContent({
  doc,
  navItems,
  hubHref,
  portalLabel,
  locale,
  children,
}: {
  doc: PublicDocumentRecord;
  navItems: PortalNavItem[];
  hubHref: string;
  portalLabel: string;
  locale: LegalLocale;
  children?: React.ReactNode;
}) {
  const isPolicy = doc.slug === "kebijakan";
  const isStatus = doc.slug === "permintaan-status";
  const isCookie = doc.slug === "cookie";
  const isDsar = doc.slug === "permintaan-data";
  const isAbout = doc.slug === "cara-kerja";
  const headings = isPolicy ? extractHeadings(doc.markdownBody) : [];

  if (isPolicy) {
    return (
      <>
        <Suspense fallback={null}>
          <PrivacyActionBar locale={locale} />
        </Suspense>
        <div className="gap-8 lg:flex">
          <aside className="hidden w-56 shrink-0 lg:block">
            <PrivacySidebarToc headings={headings} locale={locale} />
          </aside>
          <div className="min-w-0 flex-1">
            <MarkdownDocument markdown={doc.markdownBody} showToc={false} locale={locale} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!isAbout && (
        <Suspense fallback={null}>
          <PrivacyActionBar locale={locale} />
        </Suspense>
      )}
      <PortalDocShell
        doc={doc}
        navItems={navItems}
        hubHref={hubHref}
        portalLabel={portalLabel}
        locale={locale}
      >
        {isDsar && <DsarRequestForm locale={locale} />}
        {isStatus && <DsarStatusLookup locale={locale} />}
        {isCookie && <CookiePreferenceCenter locale={locale} />}
        {children}
      </PortalDocShell>
    </>
  );
}
