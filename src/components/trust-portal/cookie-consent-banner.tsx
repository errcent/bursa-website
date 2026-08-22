"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { legalHrefsFor, localeFromPathname } from "@/lib/hosts/hosts";

const STORAGE_KEY = "bursa-cookie-consent";
const CONSENT_EVENT = "bursa-cookie-consent";

type ConsentState = "accepted" | "essential-only";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname() ?? "/";
  const locale = localeFromPathname(pathname);
  const hrefs = legalHrefsFor(locale);
  const copy =
    locale === "en"
      ? {
          aria: "Cookie preferences",
          lead: "Essential for your session; analytics optional.",
          policy: "Cookie Policy",
          privacy: "Privacy",
          essential: "Essential only",
          accept: "Accept all",
          close: "Close cookie banner",
        }
      : {
          aria: "Preferensi cookie",
          lead: "Esensial untuk sesi; analitik opsional.",
          policy: "Kebijakan Cookie",
          privacy: "Privasi",
          essential: "Hanya esensial",
          accept: "Terima semua",
          close: "Tutup banner cookie",
        };

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function save(value: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={copy.aria}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-background/92 px-4 py-3 backdrop-blur-md sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <span className="font-medium text-foreground">Cookie.</span> {copy.lead}{" "}
          <Link href={hrefs.cookies} className="link-muted font-medium text-foreground">
            {copy.policy}
          </Link>
          {" · "}
          <Link href={hrefs.privacy} className="link-muted font-medium text-foreground">
            {copy.privacy}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-9 px-3" onClick={() => save("essential-only")}>
            {copy.essential}
          </Button>
          <Button
            type="button"
            size="sm"
            className="btn-primary h-9 px-4"
            onClick={() => save("accepted")}
          >
            {copy.accept}
          </Button>
          <button
            type="button"
            onClick={() => save("essential-only")}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label={copy.close}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
