"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CarouselNavButtons({
  canScrollLeft,
  canScrollRight,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  className,
}: {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-full border-border/60 bg-card/50 backdrop-blur-sm"
        onClick={onPrev}
        disabled={!canScrollLeft}
        aria-label={prevLabel}
      >
        <ArrowLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-full border-border/60 bg-card/50 backdrop-blur-sm"
        onClick={onNext}
        disabled={!canScrollRight}
        aria-label={nextLabel}
      >
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
