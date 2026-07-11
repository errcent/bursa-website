import { Skeleton } from "@/components/ui/skeleton";

function CatalogCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex w-[var(--carousel-peek-item-width)] max-w-[20rem] shrink-0 flex-col overflow-hidden rounded-xl border border-border/60"
          : "flex w-full flex-col overflow-hidden rounded-xl border border-border/60"
      }
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
    </div>
  );
}

export function CatalogBrowserSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-10" aria-busy="true" aria-label="Memuat katalog">
      <div className="surface-card catalog-filter-compact flex flex-col gap-3 bg-card p-3 md:gap-4 md:p-5">
        <Skeleton className="h-9 w-full rounded-full sm:w-56" />
        <Skeleton className="h-11 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="hidden h-6 w-48 md:block" />
        <div className="catalog-row-bleed md:hidden">
          <div className="catalog-row-scroll">
            {Array.from({ length: 4 }).map((_, i) => (
              <CatalogCardSkeleton key={i} compact />
            ))}
          </div>
        </div>
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CatalogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
