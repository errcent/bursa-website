"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { RiskDisclaimer } from "@/components/risk-disclaimer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const footerColumns = [
  {
    title: "Jelajahi",
    links: [
      { label: "Semua Kelas", href: "/katalog" },
      { label: "Mentor", href: "/katalog?view=instruktur" },
    ],
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
      { label: "Syarat & Ketentuan", href: "/syarat-dan-ketentuan" },
      { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
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
    return pathname === "/katalog" && searchParams.get("view") !== "instruktur";
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
    <footer className="footer-glass relative mt-auto overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="container-page grid gap-8 py-12 sm:gap-10 sm:py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="font-heading text-xl font-semibold tracking-tight">Bursa</span>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Platform edukasi trading untuk saham, crypto, dan forex dengan katalog mentor, kelas,
            dan proses belajar yang terstruktur.
          </p>
        </div>

        <Suspense fallback={<FooterLinkColumnsFallback />}>
          <FooterLinkColumnsMobile />
          <FooterLinkColumns />
        </Suspense>
      </div>

      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Bursa Trading Academy. Seluruh hak cipta dilindungi.</p>
          <RiskDisclaimer variant="compact" />
        </div>
      </div>
    </footer>
  );
}
