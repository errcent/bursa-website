"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { Reveal } from "@/components/motion/reveal";
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
      { label: "Saham", href: "/katalog?instrumen=Saham" },
      { label: "Crypto", href: "/katalog?instrumen=Crypto" },
      { label: "Forex", href: "/katalog?instrumen=Forex" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Dashboard", href: "/dashboard" },
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

/** Mirrors navbar `isNavLinkActive`, plus query matching for catalog instrument links. */
function isFooterLinkActive(pathname: string, href: string, searchParams: URLSearchParams) {
  const url = new URL(href, "http://localhost");
  const hrefPath = url.pathname;
  const hrefInstrumen = url.searchParams.get("instrumen");

  if (hrefInstrumen) {
    return pathname === hrefPath && searchParams.get("instrumen") === hrefInstrumen;
  }

  // Plain /katalog is active only when no instrument filter is applied.
  if (hrefPath === "/katalog") {
    return pathname === "/katalog" && !searchParams.get("instrumen");
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
  const pathname = usePathname();
  const showCatalogCta = pathname !== "/katalog";

  return (
    <footer className="footer-glass relative mt-auto overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {showCatalogCta ? (
        <div className="relative border-b border-border/60">
          <Reveal className="container-page py-12 text-center sm:py-14">
            <p className="eyebrow mb-3">Mulai belajar hari ini</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Siap bangun proses belajar trading yang terstruktur?
            </h2>
            <p className="section-copy mx-auto mt-3 max-w-lg">
              Jelajahi katalog kelas dan mentor, lalu pilih sesuai kebutuhan belajar kamu.
            </p>
            <div className="mt-6">
              <Link
                href="/katalog"
                className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Buka katalog kelas
              </Link>
            </div>
          </Reveal>
        </div>
      ) : null}

      <div className="container-page grid gap-8 py-12 sm:gap-10 sm:py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="font-heading text-xl font-semibold tracking-tight">Bursa</span>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Platform edukasi trading untuk saham, crypto, dan forex dengan katalog mentor, kelas,
            dan proses belajar yang terstruktur.
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Setiap konten kelas ditinjau tim kami sebelum dipublikasikan. Materi bersifat edukasi,
            bukan rekomendasi investasi.
          </p>
        </div>

        <Suspense fallback={<FooterLinkColumnsFallback />}>
          <FooterLinkColumnsMobile />
          <FooterLinkColumns />
        </Suspense>
      </div>

      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Bursa Trading Academy. Prototype internal.</p>
          <p className="max-w-2xl md:text-right">
            Trading dan investasi mengandung risiko kerugian modal. Keputusan sepenuhnya tanggung
            jawab pengguna.
          </p>
        </div>
      </div>
    </footer>
  );
}
