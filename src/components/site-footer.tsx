"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { RiskDisclaimer } from "@/components/risk-disclaimer";
import { AppDownloadBadges } from "@/components/app-download-badges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/bursanalar/",
    icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/bursanalar",
    icon: LinkedInIcon,
  },
  {
    label: "X",
    href: "https://x.com/BursaNalar",
    icon: XSocialIcon,
  },
] as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function XSocialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function SocialLinkButtons() {
  return (
    <div className="flex items-center gap-2">
      {socialLinks.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bursa di ${link.label}`}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent"
          >
            <Icon className="size-4" />
          </a>
        );
      })}
    </div>
  );
}

const footerColumns = [
  {
    title: "Jelajahi",
    links: [{ label: "Semua Kelas", href: "/katalog" }],
  },
  {
    title: "Platform",
    links: [
      { label: "Tentang Kami", href: "/tentang-kami" },
      { label: "Pusat Bantuan", href: "/bantuan" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profil", href: "/profil" },
      { label: "Pengaturan", href: "/pengaturan" },
      { label: "Jadi Mentor", href: "/jadi-mentor" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Pusat Privasi", href: "/privasi" },
      { label: "Pusat Kepercayaan", href: "/kepercayaan" },
      { label: "Syarat & Ketentuan", href: "/syarat-dan-ketentuan" },
    ],
  },
];

/** Mirrors navbar `isNavLinkActive` for footer links. */
function isFooterLinkActive(pathname: string, href: string, searchParams: URLSearchParams) {
  const url = new URL(href, "http://localhost");
  const hrefPath = url.pathname;
  const hrefView = url.searchParams.get("view");

  if (hrefView) {
    return pathname === hrefPath && searchParams.get("view") === hrefView;
  }

  if (hrefPath === "/katalog") {
    return pathname === "/katalog";
  }

  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function FooterLinkColumns() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      {footerColumns.map((col) => (
        <div key={col.title} className="hidden flex-col gap-3 md:flex">
          <h4 className="font-heading text-sm font-medium">{col.title}</h4>
          <ul className="flex flex-col gap-2">
            {col.links.map((link) => {
              if (link.href === "#") {
                return (
                  <li key={link.label}>
                    <span
                      className="cursor-not-allowed text-sm text-muted-foreground/45"
                      aria-disabled="true"
                    >
                      {link.label}
                    </span>
                  </li>
                );
              }

              const active = isFooterLinkActive(pathname, link.href, searchParams);

              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center text-sm transition-colors md:min-h-0",
                      active
                        ? "text-foreground opacity-100"
                        : "text-muted-foreground opacity-60 hover:text-foreground hover:opacity-100"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function FooterLinkColumnsMobile() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Accordion className="md:hidden">
      {footerColumns.map((col) => (
        <AccordionItem key={col.title} value={col.title}>
          <AccordionTrigger className="footer-accordion-trigger py-0 hover:no-underline">
            {col.title}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ul className="flex flex-col gap-1">
              {col.links.map((link) => {
                if (link.href === "#") {
                  return (
                    <li key={link.label}>
                      <span className="flex min-h-11 items-center text-sm text-muted-foreground/45">
                        {link.label}
                      </span>
                    </li>
                  );
                }
                const active = isFooterLinkActive(pathname, link.href, searchParams);
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center text-sm transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function FooterLinkColumnsFallback() {
  return (
    <>
      {footerColumns.map((col) => (
        <div key={col.title} className="flex flex-col gap-3">
          <h4 className="font-heading text-sm font-medium">{col.title}</h4>
          <ul className="flex flex-col gap-2">
            {col.links.map((link) => (
              <li key={link.label}>
                {link.href === "#" ? (
                  <span
                    className="cursor-not-allowed text-sm text-muted-foreground/45"
                    aria-disabled="true"
                  >
                    {link.label}
                  </span>
                ) : (
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground opacity-60 transition-colors hover:text-foreground hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-glass relative mt-auto overflow-hidden pt-8">
      <div className="container-page grid gap-8 py-12 sm:gap-10 sm:py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="font-heading text-xl font-semibold tracking-tight">Bursa</span>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Platform edukasi trading untuk saham, crypto, dan forex dengan katalog mentor, kelas,
            dan proses belajar yang terstruktur.
          </p>
          <SocialLinkButtons />
          <AppDownloadBadges className="pt-1" />
        </div>

        <Suspense fallback={<FooterLinkColumnsFallback />}>
          <FooterLinkColumnsMobile />
          <FooterLinkColumns />
        </Suspense>
      </div>

      <div className="border-t border-border/30">
        <div className="container-page flex flex-col gap-5 py-8 md:flex-row md:items-end md:justify-between">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground/45 uppercase">
            © {new Date().getFullYear()} Bursa
          </p>
          <RiskDisclaimer variant="compact" />
        </div>
      </div>
    </footer>
  );
}
