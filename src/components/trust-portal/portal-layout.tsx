"use client";

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  Cookie,
  Users,
  HelpCircle,
  FileText,
  ShieldCheck,
  Scale,
  Bug,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

import type { PortalNavItem, PublicDocumentRecord } from "@/lib/public-documents/types";
import { cn } from "@/lib/utils";

import { MarkdownDocument } from "./markdown-document";
import { PortalMobileNav } from "./portal-mobile-nav";

const PORTAL_ICONS: Record<string, LucideIcon> = {
  kebijakan: FileText,
  cookie: Cookie,
  "sub-prosesor": Users,
  "permintaan-data": ShieldCheck,
  faq: HelpCircle,
  keamanan: Shield,
  kontrol: Lock,
  kepatuhan: Scale,
  pelaporan: Bug,
  "sumber-daya": BookOpen,
};

function HubCard({
  href,
  title,
  description,
  slug,
}: {
  href: string;
  title: string;
  description?: string;
  slug: string;
}) {
  const Icon = PORTAL_ICONS[slug] ?? Shield;
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-3 border-t border-border/70 pt-5 transition-colors hover:border-foreground/35"
    >
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        Buka dokumen
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

export function PortalHubContent({
  hubDoc,
  navItems,
  portalBase,
  crossLink,
}: {
  hubDoc: PublicDocumentRecord;
  navItems: PortalNavItem[];
  portalBase: string;
  crossLink?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-10 pb-8">
      <MarkdownDocument markdown={hubDoc.markdownBody} showToc={false} compact />

      {navItems.length > 0 && (
        <section aria-labelledby="portal-documents-heading">
          <h2 id="portal-documents-heading" className="section-title">
            Dokumen
          </h2>
          <p className="section-copy mt-2">
            Pilih dokumen di bawah untuk detail lengkap kebijakan dan prosedur.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8">
            {navItems.map((item) => (
              <HubCard
                key={item.slug}
                href={item.href}
                title={item.title}
                description={item.description}
                slug={item.slug}
              />
            ))}
          </div>
        </section>
      )}

      {crossLink && (
        <div className="border-t border-border/60 pt-6">
          <p className="text-sm font-medium text-foreground">Portal terkait</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Lihat juga{" "}
            <Link href={crossLink.href} className="link-muted font-medium text-foreground">
              {crossLink.label}
            </Link>{" "}
            untuk informasi keamanan, kepatuhan, dan pelaporan kerentanan.
          </p>
        </div>
      )}
    </div>
  );
}

export function DraftBanner({ visible }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="mt-0.5 shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        Draft
      </span>
      <p>
        Dokumen ini belum difinalisasi advokat. Konten dapat berubah sebelum publish resmi.
      </p>
    </div>
  );
}

export function PortalDocShell({
  doc,
  navItems,
  portalBase,
  portalLabel,
  children,
  isDraft,
}: {
  doc: PublicDocumentRecord;
  navItems: PortalNavItem[];
  portalBase: string;
  portalLabel: string;
  children?: React.ReactNode;
  isDraft?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 pb-8 lg:gap-8">
      <PortalMobileNav
        portalBase={portalBase}
        portalLabel={portalLabel}
        navItems={navItems}
        activeSlug={doc.slug}
      />
      <div className="gap-8 lg:flex">
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="eyebrow mb-3">{portalLabel}</p>
          <nav className="flex flex-col gap-0.5" aria-label={`Navigasi ${portalLabel}`}>
            <Link
              href={`/${portalBase}`}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Beranda
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                aria-current={doc.slug === item.slug ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  doc.slug === item.slug
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <DraftBanner visible={isDraft} />
          <MarkdownDocument markdown={doc.markdownBody} />
          {children}
          <div className="mt-12 border-t border-border/60 pt-6">
            <p className="text-sm font-medium text-foreground">Butuh bantuan?</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Hubungi{" "}
              <a href="mailto:privacy@bursanalar.com" className="link-muted font-medium text-foreground">
                privacy@bursanalar.com
              </a>{" "}
              atau{" "}
              <a href="mailto:security@bursanalar.com" className="link-muted font-medium text-foreground">
                security@bursanalar.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
