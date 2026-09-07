"use client";

import Link from "next/link";

import type { LegalLocale } from "@/lib/hosts/hosts";
import { legalHrefsFor } from "@/lib/hosts/hosts";

const COPY = {
  id: {
    skipNav: "Lewati ke navigasi",
    skipSidebar: "Lewati ke sidebar",
    skipMain: "Lewati ke konten utama",
  },
  en: {
    skipNav: "Skip to navigation",
    skipSidebar: "Skip to sidebar",
    skipMain: "Skip to main content",
  },
} as const;

export function PrivacySkipLinks({ locale = "id" }: { locale?: LegalLocale }) {
  const t = COPY[locale];
  return (
    <div className="privacy-skip-links">
      <a href="#privacy-nav" className="privacy-skip-link">
        {t.skipNav}
      </a>
      <a href="#privacy-sidebar" className="privacy-skip-link">
        {t.skipSidebar}
      </a>
      <a href="#privacy-main" className="privacy-skip-link">
        {t.skipMain}
      </a>
    </div>
  );
}

export function PrivacyPortalHero({
  locale = "id",
  title,
  description,
}: {
  locale?: LegalLocale;
  title: string;
  description: string;
}) {
  const hrefs = legalHrefsFor(locale);
  const aboutLabel =
    locale === "en" ? "How the Privacy Center works →" : "Cara kerja Pusat Privasi →";
  const eyebrow = locale === "en" ? "Privacy Center" : "Pusat Privasi";

  return (
    <div className="hero-cinematic page-header-strip border-b border-border/40">
      <div className="container-page py-12 sm:py-16">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="page-hero-title max-w-3xl text-balance text-gradient">{title}</h1>
        <p className="section-copy mt-4 max-w-2xl text-pretty">{description}</p>
        <Link
          href={hrefs.privacyAbout}
          className="link-muted mt-4 inline-flex text-sm font-medium text-foreground"
        >
          {aboutLabel}
        </Link>
      </div>
    </div>
  );
}
