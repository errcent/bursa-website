"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const carouselNavBtnClass =
  "carousel-nav-btn rounded-md transition-colors duration-200 active:translate-y-0";

function navBtnStateClass(enabled: boolean) {
  return enabled
    ? "border-accent/50 bg-accent/10 text-accent hover:bg-accent/15 hover:border-accent/60"
    : "border-border/30 bg-muted/30 text-muted-foreground opacity-50";
}

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
        className={cn(carouselNavBtnClass, navBtnStateClass(canScrollLeft))}
        onClick={onPrev}
        disabled={!canScrollLeft}
        aria-label={prevLabel}
        aria-disabled={!canScrollLeft}
      >
        <ArrowLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className={cn(carouselNavBtnClass, navBtnStateClass(canScrollRight))}
        onClick={onNext}
        disabled={!canScrollRight}
        aria-label={nextLabel}
        aria-disabled={!canScrollRight}
      >
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
