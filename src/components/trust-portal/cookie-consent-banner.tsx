"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bursa-cookie-consent";

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
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface/95 p-4 backdrop-blur-md sm:p-5"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-medium text-foreground">Cookie & privasi</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Kami menggunakan cookie esensial agar platform berfungsi. Cookie analitik opsional membantu
            kami meningkatkan produk. Pelajari lebih lanjut di{" "}
            <Link href="/privasi/cookie" className="link-muted font-medium text-foreground">
              Kebijakan Cookie
            </Link>{" "}
            dan{" "}
            <Link href="/privasi" className="link-muted font-medium text-foreground">
              Pusat Privasi
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => save("essential-only")}>
            Hanya esensial
          </Button>
          <Button type="button" size="sm" onClick={() => save("accepted")}>
            Terima semua
          </Button>
          <button
            type="button"
            onClick={() => save("essential-only")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Tutup banner cookie"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
