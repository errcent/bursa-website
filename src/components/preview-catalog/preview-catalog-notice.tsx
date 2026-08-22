import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import { isPreviewCatalogActive } from "@/lib/preview-catalog/visibility";

export function PreviewCatalogNotice() {
  if (!isPreviewCatalogActive()) return null;

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="mt-0.5 shrink-0 rounded-md border border-border/80 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Preview
      </span>
      <p className="leading-relaxed">{PREVIEW_CATALOG_COPY.bannerDetail}</p>
    </div>
  );
}
