import { cn } from "@/lib/utils";

/** Lightweight placeholder while below-fold homepage sections hydrate. */
export function HomeSectionSkeleton({
  className,
  minHeight = "min-h-[280px]",
}: {
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-2xl bg-muted/20", minHeight, className)}
    />
  );
}
