import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import { isPreviewCatalogActive } from "@/lib/preview-catalog/visibility";

export function PreviewCatalogNotice() {
  if (!isPreviewCatalogActive()) return null;

  return (
    <div
      role="note"
      className="mx-auto flex max-w-3xl items-center gap-2 border-y border-border/45 py-2 text-muted-foreground sm:gap-2.5 sm:py-2.5"
    >
      <span className="shrink-0 rounded border border-border/70 bg-white/[0.03] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90 sm:text-[10px]">
        Pratinjau
      </span>
      <p className="min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground/90 sm:text-xs sm:leading-normal">
        {PREVIEW_CATALOG_COPY.bannerDetail}
      </p>
    </div>
  );
}
