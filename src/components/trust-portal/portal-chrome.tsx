"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { legalHrefsFor, originFor, type LegalLocale } from "@/lib/hosts/hosts";
import { legalEntityCopy } from "@/lib/legal/entity";
import { cn } from "@/lib/utils";

export function LocaleToggle({
  locale,
  idHref,
  enHref,
}: {
  locale: LegalLocale;
  idHref: string;
  enHref: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/80 p-0.5 text-xs font-medium">
      <Link
        href={idHref}
        hrefLang="id"
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "id" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        aria-current={locale === "id" ? "page" : undefined}
      >
        ID
      </Link>
      <Link
        href={enHref}
        hrefLang="en"
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "en" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        aria-current={locale === "en" ? "page" : undefined}
      >
        EN
      </Link>
    </div>
  );
}

const NAV = [
  { key: "privacy" as const, labelId: "Privasi", labelEn: "Privacy" },
  { key: "trust" as const, labelId: "Kepercayaan", labelEn: "Trust" },
  { key: "terms" as const, labelId: "Syarat", labelEn: "Terms" },
] as const;

export function PortalChrome({
  locale,
  idHref,
  enHref,
  variant = "default",
}: {
  locale: LegalLocale;
  idHref: string;
  enHref: string;
  variant?: "default" | "privacy";
}) {
  const hrefs = legalHrefsFor(locale);

  useLayoutEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale === "en" ? "en" : "id";
    return () => {
      document.documentElement.lang = previous || "id";
    };
  }, [locale]);

  return (
    <header
      id="privacy-nav"
      className={
        variant === "privacy"
          ? "border-b border-border/80 bg-card/95 backdrop-blur-sm"
          : "border-b border-border/70 bg-background/90 backdrop-blur-md"
      }
    >
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link href={originFor("apex")} className="flex items-center gap-2" aria-label="Bursa">
          <BrandLogo variant="product" decorative className="h-6 w-auto" />
        </Link>
        <nav
          className="hidden items-center gap-5 text-sm sm:flex"
          aria-label={locale === "en" ? "Legal portal" : "Portal legal"}
        >
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={hrefs[item.key]}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {locale === "en" ? item.labelEn : item.labelId}
            </Link>
          ))}
        </nav>
        <LocaleToggle locale={locale} idHref={idHref} enHref={enHref} />
      </div>
    </header>
  );
}

export function PortalFooter({
  locale,
  variant = "default",
}: {
  locale: LegalLocale;
  variant?: "default" | "privacy";
}) {
  const hrefs = legalHrefsFor(locale);
  const copy =
    locale === "en"
      ? "Indonesian is the governing language. English is a convenience translation."
      : "Bahasa Indonesia adalah naskah yang mengikat. Inggris hanya terjemahan kemudahan.";
  const official =
    locale === "en"
      ? "Official Privacy Center · PT Global Makmur Madani"
      : "Pusat Privasi resmi · PT Global Makmur Madani";
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="container-page flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-lg flex-col gap-1">
          {variant === "privacy" && (
            <p className="text-xs font-medium text-foreground/80">{official}</p>
          )}
          <p>{copy}</p>
          <p className="text-xs text-muted-foreground/70">
            {locale === "en" ? legalEntityCopy.en.imprintShort : legalEntityCopy.id.imprintShort}
          </p>
          {variant === "privacy" && (
            <Link href={hrefs.privacyAbout} className="text-xs hover:text-foreground">
              {locale === "en" ? "How this Privacy Center works" : "Cara kerja Pusat Privasi"}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href={hrefs.privacy} className="hover:text-foreground">
            {locale === "en" ? "Privacy" : "Privasi"}
          </Link>
          <Link href={hrefs.trust} className="hover:text-foreground">
            {locale === "en" ? "Trust" : "Kepercayaan"}
          </Link>
          <Link href={hrefs.terms} className="hover:text-foreground">
            {locale === "en" ? "Terms" : "Syarat"}
          </Link>
          <Link href={hrefs.guidelines} className="hover:text-foreground">
            {locale === "en" ? "Learner guidelines" : "Panduan pelajar"}
          </Link>
          <a href="mailto:privacy@bursanalar.com" className="hover:text-foreground">
            privacy@
          </a>
        </div>
      </div>
    </footer>
  );
}
