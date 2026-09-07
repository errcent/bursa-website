import Link from "next/link";

import { originFor, type LegalLocale } from "@/lib/hosts/hosts";
import { legalEntityCopy } from "@/lib/legal/entity";
import { trustCopy, trustPortalHrefs } from "@/lib/trust/public-posture";

export function TrustSkipLinks({ locale }: { locale: LegalLocale }) {
  const t = trustCopy(locale);
  return (
    <div>
      <a href="#trust-nav" className="trust-skip-link">
        {t.skipNav}
      </a>
      <a href="#trust-main" className="trust-skip-link">
        {t.skipMain}
      </a>
    </div>
  );
}

export function TrustFooter({ locale }: { locale: LegalLocale }) {
  const t = trustCopy(locale);
  const hrefs = trustPortalHrefs(locale);
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="container-page flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-lg flex-col gap-1">
          <p className="eyebrow text-primary/90">{t.official}</p>
          <p>{t.governing}</p>
          <p className="text-xs text-muted-foreground/70">
            {locale === "en" ? legalEntityCopy.en.imprintShort : legalEntityCopy.id.imprintShort}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href={hrefs.privacy} className="hover:text-foreground">
            {locale === "en" ? "Privacy" : "Privasi"}
          </Link>
          <Link href={hrefs.terms} className="hover:text-foreground">
            {locale === "en" ? "Terms" : "Syarat"}
          </Link>
          <Link href={originFor("apex")} className="hover:text-foreground">
            bursanalar.com
          </Link>
          <a href="mailto:security@bursanalar.com" className="hover:text-foreground">
            security@
          </a>
        </div>
      </div>
    </footer>
  );
}

export function TrustPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="hero-cinematic page-header-strip trust-hero border-b border-border/40">
      <div className="container-page py-12 sm:py-16">
        <h1 className="page-hero-title max-w-3xl text-balance text-gradient">{title}</h1>
        {description ? (
          <p className="section-copy mt-4 max-w-2xl text-pretty">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
