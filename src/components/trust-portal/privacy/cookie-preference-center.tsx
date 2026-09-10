"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LegalLocale } from "@/lib/hosts/hosts";
import {
  CONSENT_EVENT,
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  type CookieConsentCategories,
  readStoredCategories,
  serializeConsentCategories,
  VISITOR_ID_KEY,
} from "@/lib/privacy/consent";

const COPY = {
  id: {
    title: "Preferensi cookie",
    essential: "Esensial",
    essentialDesc: "Diperlukan agar platform berfungsi (tidak bisa dinonaktifkan).",
    functional: "Fungsional",
    functionalDesc: "Preferensi tampilan dan pengalaman belajar.",
    analytics: "Analitik",
    analyticsDesc: "Membantu kami memahami penggunaan agregat (PostHog).",
    save: "Simpan preferensi",
    saved: "Preferensi disimpan.",
  },
  en: {
    title: "Cookie preferences",
    essential: "Essential",
    essentialDesc: "Required for the platform to work (cannot be disabled).",
    functional: "Functional",
    functionalDesc: "Display and learning experience preferences.",
    analytics: "Analytics",
    analyticsDesc: "Helps us understand aggregate usage (PostHog).",
    save: "Save preferences",
    saved: "Preferences saved.",
  },
} as const;

function readStored(): CookieConsentCategories {
  try {
    return (
      readStoredCategories(localStorage.getItem(CONSENT_STORAGE_KEY)) ?? {
        essential: true,
        functional: false,
        analytics: false,
      }
    );
  } catch {
    return { essential: true, functional: false, analytics: false };
  }
}

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

export function CookiePreferenceCenter({ locale = "id" }: { locale?: LegalLocale }) {
  const t = COPY[locale];
  const [categories, setCategories] = useState<CookieConsentCategories>(readStored);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategories(readStored());
  }, []);

  const persist = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const serialized = serializeConsentCategories(categories);
      localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: serialized }));
      await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: ensureVisitorId(),
          categories,
          version: CONSENT_POLICY_VERSION,
          locale,
        }),
      });
      setSaved(true);
    } catch {
      /* local save still applied */
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [categories, locale]);

  return (
    <section id="manage" className="mt-8 rounded-2xl border border-border bg-card/60 p-6">
      <h2 className="font-heading text-lg font-semibold">{t.title}</h2>
      <ul className="mt-4 space-y-4">
        <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <p className="font-medium text-sm">{t.essential}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.essentialDesc}</p>
          </div>
          <input type="checkbox" checked disabled className="mt-1 size-4" aria-label={t.essential} />
        </li>
        <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <p className="font-medium text-sm">{t.functional}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.functionalDesc}</p>
          </div>
          <input
            type="checkbox"
            checked={categories.functional}
            onChange={(e) => setCategories((c) => ({ ...c, functional: e.target.checked }))}
            className="mt-1 size-4"
            aria-label={t.functional}
          />
        </li>
        <li className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{t.analytics}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.analyticsDesc}</p>
          </div>
          <input
            type="checkbox"
            checked={categories.analytics}
            onChange={(e) => setCategories((c) => ({ ...c, analytics: e.target.checked }))}
            className="mt-1 size-4"
            aria-label={t.analytics}
          />
        </li>
      </ul>
      <Button type="button" className="mt-6" disabled={saving} onClick={persist}>
        {t.save}
      </Button>
      {saved && <p className="mt-2 text-sm text-emerald">{t.saved}</p>}
    </section>
  );
}
