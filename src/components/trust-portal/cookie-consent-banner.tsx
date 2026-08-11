"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bursa-cookie-consent";
const CONSENT_EVENT = "bursa-cookie-consent";

type ConsentState = "accepted" | "essential-only";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

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
      aria-label="Preferensi cookie"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-background/92 px-4 py-3 backdrop-blur-md sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <span className="font-medium text-foreground">Cookie.</span> Esensial untuk sesi; analitik
          opsional.{" "}
          <Link href="/privasi/cookie" className="link-muted font-medium text-foreground">
            Kebijakan Cookie
          </Link>
          {" · "}
          <Link href="/privasi" className="link-muted font-medium text-foreground">
            Privasi
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-9 px-3" onClick={() => save("essential-only")}>
            Hanya esensial
          </Button>
          <Button
            type="button"
            size="sm"
            className="btn-primary h-9 px-4"
            onClick={() => save("accepted")}
          >
            Terima semua
          </Button>
          <button
            type="button"
            onClick={() => save("essential-only")}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label="Tutup banner cookie"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
