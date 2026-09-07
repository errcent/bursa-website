"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleToggle } from "@/components/trust-portal/portal-chrome";
import type { LegalLocale } from "@/lib/hosts/hosts";
import { trustCopy, type TrustTab } from "@/lib/trust/public-posture";
import { cn } from "@/lib/utils";

export function TrustChrome({
  locale,
  idHref,
  enHref,
  activeTab,
  hrefs,
}: {
  locale: LegalLocale;
  idHref: string;
  enHref: string;
  activeTab?: TrustTab | null;
  hrefs: { hub: string; controls: string; resources: string; request: string };
}) {
  const t = trustCopy(locale);

  useLayoutEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale === "en" ? "en" : "id";
    return () => {
      document.documentElement.lang = previous || "id";
    };
  }, [locale]);

  const tabs: { id: TrustTab; href: string; label: string }[] = [
    { id: "overview", href: hrefs.hub, label: t.overview },
    { id: "controls", href: hrefs.controls, label: t.controls },
    { id: "resources", href: hrefs.resources, label: t.resources },
  ];

  return (
    <header id="trust-nav" className="sticky top-0 z-40 border-b border-border/80 bg-[#101820]/95 backdrop-blur-sm">
      <div className="container-page flex h-14 items-center justify-between gap-3">
        <Link href={hrefs.hub} className="flex min-w-0 items-center gap-2.5" aria-label={t.centerName}>
          <BrandLogo variant="product" decorative className="h-5 w-auto" />
          <span className="trust-mono hidden truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:inline">
            {t.centerName}
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleToggle locale={locale} idHref={idHref} enHref={enHref} />
          <Link
            href={hrefs.request}
            className="trust-mono rounded-sm bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-primary-foreground hover:bg-[#d4b88a]"
          >
            {t.requestCta}
          </Link>
        </div>
      </div>
      <nav
        className="container-page flex gap-6 border-t border-border/50"
        aria-label={locale === "en" ? "Trust Center sections" : "Bagian Pusat Kepercayaan"}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={cn(
              "trust-tab trust-mono border-b-2 border-transparent py-2.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground",
              activeTab === tab.id && "text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
