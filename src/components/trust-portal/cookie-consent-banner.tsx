"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { legalHrefsFor, localeFromPathname } from "@/lib/hosts/hosts";
import {
  CONSENT_EVENT,
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  readStoredCategories,
  serializeConsentCategories,
  VISITOR_ID_KEY,
  type CookieConsentCategories,
} from "@/lib/privacy/consent";

function ensureVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function readCategories(): CookieConsentCategories | null {
  try {
    return readStoredCategories(localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const pathname = usePathname() ?? "/";
  const locale = localeFromPathname(pathname);
  const hrefs = legalHrefsFor(locale);
  const copy =
    locale === "en"
      ? {
          aria: "Cookie preferences",
          lead: "Essential for your session; choose optional categories below.",
          policy: "Cookie Policy",
          privacy: "Privacy",
          essential: "Essential only",
          accept: "Accept all",
          customize: "Customize",
          save: "Save choices",
          functional: "Functional",
          analytics: "Analytics",
          close: "Close cookie banner",
        }
      : {
          aria: "Preferensi cookie",
          lead: "Esensial untuk sesi; pilih kategori opsional di bawah.",
          policy: "Kebijakan Cookie",
          privacy: "Privasi",
          essential: "Hanya esensial",
          accept: "Terima semua",
          customize: "Sesuaikan",
          save: "Simpan pilihan",
          functional: "Fungsional",
          analytics: "Analitik",
          close: "Tutup banner cookie",
        };

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined" && document.documentElement.dataset.portalSurface === "privacy") {
      return;
    }
    if (!readCategories()) {
      setVisible(true);
    }
  }, []);

  async function persist(categories: CookieConsentCategories) {
    const serialized = serializeConsentCategories(categories);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: serialized }));
      void fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: ensureVisitorId(),
          categories,
          version: CONSENT_POLICY_VERSION,
          locale,
        }),
      });
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function saveAll() {
    void persist({ essential: true, functional: true, analytics: true });
  }

  function saveEssential() {
    void persist({ essential: true, functional: false, analytics: false });
  }

  function saveCustom() {
    void persist({ essential: true, functional, analytics });
  }

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-label={copy.aria}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[80] border-t border-border/80 bg-background/92 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="container-page flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-9 px-3" onClick={() => setExpanded((v) => !v)}>
              {copy.customize}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-9 px-3" onClick={saveEssential}>
              {copy.essential}
            </Button>
            <Button type="button" size="sm" className="btn-primary h-9 px-4" onClick={saveAll}>
              {copy.accept}
            </Button>
            <button
              type="button"
              onClick={saveEssential}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              aria-label={copy.close}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {expanded && (
          <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={functional} onChange={(e) => setFunctional(e.target.checked)} />
              {copy.functional}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              {copy.analytics}
            </label>
            <Button type="button" size="sm" variant="outline" onClick={saveCustom}>
              {copy.save}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
