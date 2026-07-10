"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { Code2, GraduationCap, LayoutDashboard, Menu, Shield } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { AccountMenuMobileLinks } from "@/components/account-menu-mobile-links";
import { useAuth } from "@/components/auth-provider";
import { SiteNavAuth } from "@/components/site-nav-auth";
import { SiteNavSearch } from "@/components/site-nav-search";
import { Button } from "@/components/ui/button";
import { getRoleNavLinks } from "@/lib/auth/roles";
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

const navLinks = [
  { href: "/", label: "Beranda", exact: true },
  { href: "/katalog", label: "Katalog" },
  { href: "/komunitas", label: "Komunitas" },
];

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

export function SiteNavbar() {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const { session } = useAuth();
  const isKatalog = pathname === "/katalog";
  const [menuOpen, setMenuOpen] = useState(false);
  const roleLinks = getRoleNavLinks(session?.role);

  return (
    <div className="nav-shell">
      <motion.header
        className="nav-glass"
        initial={prefersReducedMotion ? false : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
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

          {!isKatalog && (
            <Suspense
              fallback={
                <SearchSkeleton className="hidden h-9 max-w-xs flex-1 animate-pulse rounded-full bg-muted xl:flex" />
              }
            >
              <SiteNavSearch className="hidden max-w-xs flex-1 xl:flex" />
            </Suspense>
          )}

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
                  {!isKatalog && (
                    <Suspense fallback={<SearchSkeleton className="mb-2" />}>
                      <SiteNavSearch
                        className="mb-2 w-full"
                        onNavigate={() => setMenuOpen(false)}
                      />
                    </Suspense>
                  )}

                  <div className="mb-3 grid gap-2">
                    <SheetClose
                      render={
                        <Link
                          href={session ? "/dashboard" : "/katalog"}
                          className="btn-primary flex min-h-12 items-center justify-center rounded-xl text-[15px] font-medium"
                        />
                      }
                    >
                      {session ? "Lanjut Belajar" : "Mulai Belajar"}
                    </SheetClose>
                    {!session && (
                      <SheetClose
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

                  <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
                    {navLinks.map((link) => {
                      const active = isNavLinkActive(pathname, link.href, link.exact);
                      return (
                        <SheetClose
                          key={link.label}
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
      </motion.header>
    </div>
  );
}
