import { Star } from "lucide-react";

import { cn, formatRating, hasRating } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export function StarRating({ rating, reviewCount, className }: StarRatingProps) {
  if (!hasRating(rating)) return null;

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      <Star className="size-3.5 fill-foreground text-foreground" />
      <span className="font-medium text-foreground">{formatRating(rating)}</span>
      {reviewCount !== undefined && (
        <span className="text-muted-foreground">{reviewCount.toLocaleString("id-ID")} siswa</span>
      )}
    </div>
  );
}
