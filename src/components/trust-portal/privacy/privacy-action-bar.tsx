"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { LegalLocale } from "@/lib/hosts/hosts";
import { legalHrefsFor } from "@/lib/hosts/hosts";

const COPY = {
  id: {
    viewRequests: "Lihat permintaan",
    makeRequest: "Ajukan permintaan",
  },
  en: {
    viewRequests: "View past requests",
    makeRequest: "Make a privacy request",
  },
} as const;

export function PrivacyActionBar({ locale = "id" }: { locale?: LegalLocale }) {
  const t = COPY[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  const hrefs = legalHrefsFor(locale);

  function openModal(modal: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("modal", modal);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="sticky top-14 z-20 -mx-1 mb-6 flex flex-wrap items-center justify-end gap-2 border-b border-border/60 bg-card/95 px-1 py-3 backdrop-blur-sm">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="privacy-action-secondary h-9"
        onClick={() => router.push(hrefs.dsarStatus)}
      >
        {t.viewRequests}
      </Button>
      <Button
        type="button"
        size="sm"
        className="privacy-action-primary h-9 border-0"
        onClick={() => openModal("select-subject")}
      >
        {t.makeRequest}
      </Button>
    </div>
  );
}
