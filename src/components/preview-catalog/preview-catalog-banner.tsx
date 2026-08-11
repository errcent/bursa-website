"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { PREVIEW_BANNER_DISMISS_KEY, PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import { shouldShowPreviewBanner } from "@/lib/preview-catalog/visibility";

export function PreviewCatalogBanner() {
  const pathname = usePathname() ?? "";
  const [dismissed, setDismissed] = useState(true);
  const eligible = shouldShowPreviewBanner(pathname);

  useEffect(() => {
    if (!eligible) {
      setDismissed(true);
      return;
    }
    try {
      setDismissed(sessionStorage.getItem(PREVIEW_BANNER_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [eligible, pathname]);

  if (!eligible || dismissed) return null;

  function handleDismiss() {
    try {
      sessionStorage.setItem(PREVIEW_BANNER_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <div
      role="note"
      className="border-b border-border/70 bg-white/[0.02] px-3 py-2 sm:px-5"
    >
      <div className="container-page flex items-center gap-3">
        <span className="shrink-0 rounded-md border border-border/80 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Preview
        </span>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
          {PREVIEW_CATALOG_COPY.bannerShort}
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          aria-label="Tutup peringatan preview"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
