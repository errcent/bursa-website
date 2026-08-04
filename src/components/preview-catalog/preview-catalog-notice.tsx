import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import { isPreviewCatalogActive } from "@/lib/preview-catalog/visibility";

export function PreviewCatalogNotice() {
  if (!isPreviewCatalogActive()) return null;

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="mt-0.5 shrink-0 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Preview
      </span>
      <p className="leading-relaxed">{PREVIEW_CATALOG_COPY.bannerDetail}</p>
    </div>
  );
}
