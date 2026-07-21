"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { shouldPlayNavbarIntro } from "@/lib/nav/navbar-intro-state";
import { Code2, GraduationCap, LayoutDashboard, Menu, Search, Shield, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { AccountMenuMobileLinks } from "@/components/account-menu-mobile-links";
import { useAuth } from "@/components/auth-provider";
import { useHeroNav } from "@/components/hero-nav-context";
import { SiteNavAuth } from "@/components/site-nav-auth";
import { SiteNavSearch } from "@/components/site-nav-search";
import { Button } from "@/components/ui/button";
import { getRoleNavLinks } from "@/lib/auth/roles";
import { isSameNavDestination } from "@/lib/nav/route-navbar";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
}[] = [
  { href: "/katalog", label: "Katalog", prefetch: true },
  { href: "/komunitas", label: "Komunitas" },
  { href: "/lab", label: "Lab" },
];

const navLinks = KOMUNITAS_ENABLED
  ? baseNavLinks
  : baseNavLinks.filter((link) => link.href !== "/komunitas");

function isNavLinkActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function SearchSkeleton({ className }: { className?: string }) {
  return <div className={className ?? "h-9 w-full animate-pulse rounded-full bg-muted"} />;
}

function RoleLinkIcon({ href }: { href: string }) {
  if (href.startsWith("/dashboard")) return <LayoutDashboard className="size-3.5 opacity-70" />;
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
  const [mobileCatalogSearchOpen, setMobileCatalogSearchOpen] = useState(false);
  /** Deferred to mount — sessionStorage differs between SSR and client. */
  const [runIntro, setRunIntro] = useState(false);
  const roleLinks = getRoleNavLinks(session?.role);
  const primaryCtaHref = session ? "/dashboard" : "/katalog";
  const showPrimaryCta = !isSameNavDestination(pathname, primaryCtaHref);
  const isKatalogRoute = isSameNavDestination(pathname, "/katalog");
  const showMobileCatalogSearch = isKatalogRoute && mobileCatalogSearchOpen;

  useEffect(() => {
    if (isHeroAnchor || prefersReducedMotion) return;
    if (shouldPlayNavbarIntro(pathname, false)) {
      setRunIntro(true);
    }
  }, [pathname, prefersReducedMotion, isHeroAnchor]);

  // Hero scroll glass: strength-driven modifier for full dock→pin range (pinned = strength 1).
  const navHeaderClassName = cn("nav-glass", isHeroAnchor && "nav-glass--hero-anchor");

  const navHeaderInner = (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="flex h-14 min-h-14 items-center justify-between gap-2 px-3 sm:h-[3.75rem] sm:gap-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
                Bursa
              </span>
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
                        ? "text-foreground opacity-100"
                        : "text-muted-foreground opacity-60 hover:text-foreground hover:opacity-100"
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
              <SearchSkeleton className="hidden h-9 max-w-[13rem] flex-1 animate-pulse rounded-full bg-muted lg:flex xl:max-w-xs" />
            }
          >
            {isHeroAnchor ? (
              <div
                data-hero-nav-search
                className={cn(
                  "hero-nav-search-slot hidden lg:flex xl:max-w-xs",
                  searchVisible && "is-visible",
                  searchReveal && "is-interactive"
                )}
              >
                <SiteNavSearch
                  reveal={searchActive}
                  className="w-full min-w-[8rem] max-w-none xl:max-w-xs"
                />
              </div>
            ) : (
              <SiteNavSearch className="hidden max-w-[13rem] flex-1 lg:flex xl:max-w-xs" />
            )}
          </Suspense>

          <div className="flex items-center gap-1 sm:gap-2">
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
            <div className="hidden lg:contents">
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
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:hidden"
                    aria-label="Buka menu navigasi"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-[100dvh] w-full max-w-none flex-col border-0 bg-background/98 p-0 backdrop-blur-xl sm:max-w-[min(100vw,400px)] lg:hidden"
              >
                <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
                  <SheetTitle className="font-heading text-lg">Menu Bursa</SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigasi utama dan aksi cepat
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
                  <Suspense fallback={<SearchSkeleton className="mb-2" />}>
                    {menuOpen ? (
                      <SiteNavSearch
                        className="mb-2 w-full"
                        openOnFocus={false}
                        onNavigate={() => setMenuOpen(false)}
                      />
                    ) : (
                      <SearchSkeleton className="mb-2" />
                    )}
                  </Suspense>

                  {(showPrimaryCta || !session) && (
                    <div className="mb-3 grid gap-2">
                      {showPrimaryCta && (
                        <SheetClose
                          nativeButton={false}
                          render={
                            <Link
                              href={primaryCtaHref}
                              className="btn-primary flex min-h-12 items-center justify-center rounded-xl text-[15px] font-medium"
                            />
                          }
                        >
                          {session ? "Lanjut Belajar" : "Mulai Belajar"}
                        </SheetClose>
                      )}
                      {!session && (
                        <SheetClose
                          nativeButton={false}
                          render={
                            <Link
                              href="/daftar"
                              className="flex min-h-12 items-center justify-center rounded-xl border border-border/70 bg-card/50 text-[15px] font-medium"
                            />
                          }
                        >
                          Daftar Gratis
                        </SheetClose>
                      )}
                    </div>
                  )}

                  <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
                    {navLinks.map((link) => {
                      const active = isNavLinkActive(pathname, link.href, link.exact);
                      return (
                        <SheetClose
                          key={link.label}
                          nativeButton={false}
                          render={
                            <Link
                              href={link.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "mobile-nav-item",
                                active
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                              )}
                            />
                          }
                        >
                          {link.label}
                        </SheetClose>
                      );
                    })}
                  </nav>

                  {session && (
                    <div className="mt-4 border-t border-border/60 pt-4">
                      <AccountMenuMobileLinks
                        roleLinks={roleLinks}
                        onNavigate={() => setMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>

                {!session && (
                  <div className="mt-auto border-t border-border/60 p-4">
                    <Suspense fallback={<AuthSkeleton mobile />}>
                      <SiteNavAuth mobileMenu />
                    </Suspense>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
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
    </div>
  );
}
