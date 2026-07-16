"use client";

import Link from "next/link";
import { ArrowRight, Shield, Lock } from "lucide-react";

import type { PortalNavItem, PublicDocumentRecord } from "@/lib/public-documents/types";
import { cn } from "@/lib/utils";

import { MarkdownDocument } from "./markdown-document";
import { PortalMobileNav } from "./portal-mobile-nav";

const PORTAL_ICONS: Record<string, typeof Shield> = {
  kebijakan: Lock,
  cookie: Lock,
  "sub-prosesor": Shield,
  "permintaan-data": Shield,
  faq: Shield,
  keamanan: Shield,
  kontrol: Shield,
  kepatuhan: Shield,
  pelaporan: Shield,
  "sumber-daya": Shield,
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
      className="group surface-card flex flex-col gap-3 p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="font-heading text-base font-semibold">{title}</h3>
      </div>
      {description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
        Buka
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
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
    <div className="flex flex-col gap-10">
      <MarkdownDocument markdown={hubDoc.markdownBody} showToc={false} />

      {navItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
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
      )}

      {crossLink && (
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
          <p className="text-sm text-muted-foreground">
            Lihat juga{" "}
            <Link href={crossLink.href} className="link-muted font-medium text-foreground">
              {crossLink.label}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export function DraftBanner({ visible }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      Dokumen ini masih <strong>DRAFT</strong> — belum difinalisasi advokat. Konten dapat berubah.
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
    <div className="flex flex-col gap-10">
      <PortalMobileNav
        portalBase={portalBase}
        portalLabel={portalLabel}
        navItems={navItems}
        activeSlug={doc.slug}
      />
      <div className="gap-8 lg:flex">
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="eyebrow mb-3">{portalLabel}</p>
        <nav className="flex flex-col gap-1" aria-label={`Navigasi ${portalLabel}`}>
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
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                doc.slug === item.slug
                  ? "bg-primary/15 text-primary font-medium"
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
        <div className="mt-12 rounded-2xl border border-border/60 bg-surface/40 p-5">
          <p className="text-sm text-muted-foreground">
            Ada pertanyaan? Hubungi{" "}
            <a href="mailto:privacy@bursa.id" className="link-muted font-medium text-foreground">
              privacy@bursa.id
            </a>{" "}
            atau{" "}
            <a href="mailto:security@bursa.id" className="link-muted font-medium text-foreground">
              security@bursa.id
            </a>
            .
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
