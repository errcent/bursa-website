"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

const MARKETING_PATHS = ["/", "/katalog"];

function shouldShow(pathname: string) {
  return MARKETING_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`))
  );
}

/** Mobile-only sticky CTA after scrolling past the hero. */
export function StickyBottomCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShow(pathname)) {
      setVisible(false);
      return;
    }

    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (!shouldShow(pathname) || !visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 p-3 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/katalog"
        className="btn-primary flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium"
      >
        Mulai Belajar
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
