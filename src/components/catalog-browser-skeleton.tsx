import { Skeleton } from "@/components/ui/skeleton";

function CatalogCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex w-[var(--catalog-card-width)] shrink-0 flex-col overflow-hidden rounded-xl border border-border/60"
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
      <div className="space-y-6">
        <Skeleton className="hidden h-6 w-48 md:block" />
        <div className="catalog-row-bleed md:hidden">
          <div className="catalog-row-scroll">
            {Array.from({ length: 4 }).map((_, i) => (
              <CatalogCardSkeleton key={i} compact />
            ))}
          </div>
        </div>
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <CatalogCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="catalog-guidance border-t border-border/30 pt-6" aria-hidden>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-52 max-w-full" />
            <Skeleton className="h-3.5 w-40 max-w-full" />
          </div>
          <Skeleton className="h-9 w-full shrink-0 rounded-md sm:w-24" />
        </div>
      </div>
    </div>
  );
}
