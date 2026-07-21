"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

/** Only these marketing pages may show the sticky CTA (not /katalog — user is already browsing). */
const ALLOWED_PATHS = ["/"] as const;

/** App / auth / checkout routes — always hide, even if allowlist logic changes. */
const HIDDEN_PATH_PREFIXES = [
  "/komunitas",
  "/belajar",
  "/dashboard",
  "/admin",
  "/masuk",
  "/daftar",
  "/login",
  "/checkout",
  "/pengaturan",
  "/profil",
  "/mentor",
  "/developer",
  "/kelas",
  "/instruktur",
  "/jadi-mentor",
  "/privasi",
  "/kepercayaan",
  "/syarat-dan-ketentuan",
] as const;

function isHiddenPath(pathname: string) {
  return HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAllowedPath(pathname: string) {
  return ALLOWED_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`))
  );
}

function shouldShow(pathname: string | null) {
  if (!pathname) return false;
  if (isHiddenPath(pathname)) return false;
  return isAllowedPath(pathname);
}

function hasOpenOverlay() {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector('[data-slot="sheet-content"][data-open]') ||
      document.querySelector("dialog[open]")
  );
}

/** Mobile-only sticky CTA after scrolling past the hero. */
export function StickyBottomCta() {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const allowed = shouldShow(pathname);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useLayoutEffect(() => {
    if (!allowed) {
      setScrolledPastHero(false);
    }
  }, [allowed, pathname]);

  useEffect(() => {
    if (!allowed) return;

    const onScroll = () => setScrolledPastHero(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [allowed, pathname]);

  useEffect(() => {
    if (!allowed) {
      setOverlayOpen(false);
      return;
    }

    const syncOverlay = () => setOverlayOpen(hasOpenOverlay());

    syncOverlay();
    const observer = new MutationObserver(syncOverlay);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-open", "open"],
    });

    return () => observer.disconnect();
  }, [allowed, pathname]);

  if (!allowed || !scrolledPastHero || overlayOpen || isLoading) return null;

  const isMember = Boolean(session);
  const ctaHref = isMember ? "/dashboard" : "/katalog";
  const ctaLabel = isMember ? "Lanjut Belajar" : "Mulai Belajar";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 p-3 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href={ctaHref}
        className="btn-primary flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium"
      >
        {ctaLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
