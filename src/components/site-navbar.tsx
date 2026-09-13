"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { shouldPlayNavbarIntro } from "@/lib/nav/navbar-intro-state";
import { Code2, GraduationCap, Menu, Search, Shield, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { AccountMenuMobileLinks } from "@/components/account-menu-mobile-links";
import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import { useHeroNav } from "@/components/hero-nav-context";
import { SiteNavAuth } from "@/components/site-nav-auth";
import { SiteNavSearch } from "@/components/site-nav-search";
import { Button } from "@/components/ui/button";
import { getRoleNavLinks } from "@/lib/auth/roles";
import { isSameNavDestination } from "@/lib/nav/route-navbar";
import { cn } from "@/lib/utils";

function AuthSkeleton({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />;
  }

  return <div className="hidden h-8 w-20 animate-pulse rounded-lg bg-muted sm:block" />;
}

const baseNavLinks: {
  href: string;
  label: string;
  exact?: boolean;
  prefetch?: boolean;
}[] = [{ href: "/katalog", label: "Katalog", prefetch: true }];

const navLinks = baseNavLinks;

function isNavLinkActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function SearchSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "mx-auto hidden h-9 w-[9.5rem] shrink-0 animate-pulse rounded-full bg-muted lg:block"
      }
    />
  );
}

function RoleLinkIcon({ href }: { href: string }) {
  if (href.startsWith("/dashboard")) return null;
  if (href.startsWith("/admin")) return <Shield className="size-3.5 opacity-70" />;
  if (href.startsWith("/mentor")) return <GraduationCap className="size-3.5 opacity-70" />;
  return <Code2 className="size-3.5 opacity-70" />;
}

export function SiteNavbar({ layout = "default" }: { layout?: "default" | "hero-anchor" }) {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const { session } = useAuth();
  const { searchReveal, searchVisible } = useHeroNav();
  const isHeroAnchor = layout === "hero-anchor";
  const searchActive = !isHeroAnchor || searchReveal;
  const [menuOpen, setMenuOpen] = useState(false);
  const [navPortalReady, setNavPortalReady] = useState(false);
  const [mobileCatalogSearchOpen, setMobileCatalogSearchOpen] = useState(false);
  /** Deferred to mount, sessionStorage differs between SSR and client. */
  const [runIntro, setRunIntro] = useState(false);
  const roleLinks = getRoleNavLinks(session?.role);
  const primaryCtaHref = session ? "/dashboard" : "/waitlist";
  const showPrimaryCta = !isSameNavDestination(pathname, primaryCtaHref);
  const isKatalogRoute = isSameNavDestination(pathname, "/katalog");
  const showMobileCatalogSearch = isKatalogRoute && mobileCatalogSearchOpen;

  useEffect(() => {
    if (isHeroAnchor || prefersReducedMotion) return;
    if (shouldPlayNavbarIntro(pathname, false)) {
      setRunIntro(true);
    }
  }, [pathname, prefersReducedMotion, isHeroAnchor]);

  useEffect(() => {
    setNavPortalReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("mobile-nav-shift", menuOpen);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.classList.remove("mobile-nav-shift");
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Hero scroll glass: strength-driven modifier for full dock→pin range (pinned = strength 1).
  const navHeaderClassName = cn("nav-glass", isHeroAnchor && "nav-glass--hero-anchor");

  const navHeaderInner = (
    <>
      <div className="nav-glass-accent-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="flex h-14 min-h-14 items-center gap-2 px-3 sm:h-[3.75rem] sm:gap-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Bursa">
              <BrandLogo variant="product" priority decorative />
            </Link>
            <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama">
              {navLinks.map((link) => {
                const active = isNavLinkActive(pathname, link.href, link.exact);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    prefetch={link.prefetch}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Suspense
            fallback={
              <SearchSkeleton className="hidden h-9 w-[9.5rem] shrink-0 animate-pulse rounded-full bg-muted lg:block" />
            }
          >
            {isHeroAnchor ? (
              <div
                data-hero-nav-search
                className={cn(
                  "hero-nav-search-slot hidden min-w-0 lg:flex",
                  searchVisible && "is-visible",
                  searchReveal && "is-interactive"
                )}
              >
                <SiteNavSearch reveal={searchActive} />
              </div>
            ) : (
              <div className="hidden min-w-0 lg:block">
                <SiteNavSearch />
              </div>
            )}
          </Suspense>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {roleLinks.length > 0 && (
              <nav
                className="hidden items-center gap-1 border-l border-border/60 pl-2 lg:flex"
                aria-label="Akses role"
              >
                {roleLinks.map((link) => {
                  const active = isNavLinkActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <RoleLinkIcon href={link.href} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <Suspense fallback={<AuthSkeleton />}>
                <SiteNavAuth />
              </Suspense>
            </div>
            {isKatalogRoute && (
              <>
                {showMobileCatalogSearch ? (
                  <div className="fixed inset-x-0 top-0 z-[250] border-b border-border/60 bg-background/98 backdrop-blur-xl lg:hidden">
                    <div className="flex h-14 min-h-14 items-center gap-2 px-3">
                      <Suspense fallback={<SearchSkeleton className="flex-1" />}>
                      <SiteNavSearch
                        className="min-w-0 flex-1"
                        variant="inline"
                        initialOpen
                        onNavigate={() => setMobileCatalogSearchOpen(false)}
                        onDismiss={() => setMobileCatalogSearchOpen(false)}
                      />
                      </Suspense>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0"
                        aria-label="Tutup pencarian"
                        onClick={() => setMobileCatalogSearchOpen(false)}
                      >
                        <X className="size-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:hidden"
                    aria-label="Cari di katalog"
                    onClick={() => setMobileCatalogSearchOpen(true)}
                  >
                    <Search className="size-5" />
                  </Button>
                )}
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 lg:hidden"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu navigasi"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
    </>
  );

  const mobileNavPanel = (
    <>
      <div
        className={cn(
          "mobile-nav-backdrop fixed inset-0 z-[88] bg-black/20 transition-opacity duration-300 lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        id="mobile-nav-panel"
        aria-hidden={!menuOpen}
        className={cn(
          "mobile-nav-panel fixed inset-y-0 right-0 z-[90] flex w-[min(88vw,360px)] flex-col border-l border-border/70 bg-background shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <span className="font-heading text-sm font-medium text-foreground">Menu</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          {showPrimaryCta ? (
            <Link
              href={primaryCtaHref}
              onClick={() => setMenuOpen(false)}
              className="btn-primary mb-6 flex min-h-11 items-center justify-center rounded-xl text-sm font-medium"
            >
              {session ? "Lanjut Belajar" : "Gabung Waitlist"}
            </Link>
          ) : null}

          <nav className="flex flex-col gap-0.5" aria-label="Navigasi mobile">
            {navLinks.map((link) => {
              const active = isNavLinkActive(pathname, link.href, link.exact);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "mobile-nav-item rounded-xl",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {session ? (
            <div className="mt-6 border-t border-border/60 pt-5">
              <AccountMenuMobileLinks
                roleLinks={roleLinks}
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );

  return (
    <div
      className={cn(
        "nav-shell",
        layout === "default" && "sticky top-0 z-50",
        isHeroAnchor && "nav-shell--hero-anchor"
      )}
      {...(isHeroAnchor ? { "data-hero-nav-shell": true } : {})}
    >
      {isHeroAnchor ? (
        <header className={navHeaderClassName} data-hero-nav-glass>
          {navHeaderInner}
        </header>
      ) : (
        <motion.header
          key={runIntro ? "navbar-intro" : "navbar-static"}
          className={navHeaderClassName}
          initial={runIntro ? { y: -16, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={runIntro ? { duration: 0.5, ease: easeOut } : { duration: 0 }}
        >
          {navHeaderInner}
        </motion.header>
      )}
      {navPortalReady ? createPortal(mobileNavPanel, document.body) : null}
    </div>
  );
}
