"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { CarouselNavButtons } from "@/components/carousel-nav-buttons";
import {
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
  type ScrollCarouselHandle,
} from "@/components/scroll-carousel";

export type CatalogCarouselRowProps = {
  title: string;
  ariaLabel?: string;
  getPerView: (width: number) => number;
  mobileScrollClassName?: string;
  children: ReactNode;
  prevLabel?: string;
  nextLabel?: string;
};

export function CatalogCarouselRow({
  title,
  ariaLabel,
  getPerView,
  mobileScrollClassName = "catalog-row-scroll",
  children,
  prevLabel = "Gulir ke kiri",
  nextLabel = "Gulir ke kanan",
}: CatalogCarouselRowProps) {
  const carouselRef = useRef<ScrollCarouselHandle>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const applyScrollState = useCallback(
    (state: { canScrollLeft: boolean; canScrollRight: boolean }) => {
      setCanScrollLeft(state.canScrollLeft);
      setCanScrollRight(state.canScrollRight);
    },
    []
  );

  const scrollByStep = useCallback((direction: -1 | 1) => {
    carouselRef.current?.scrollByStep(direction);
  }, []);

  const label = ariaLabel ?? title;

  return (
    <section className="catalog-row" aria-label={label}>
      <div className="catalog-row-header">
        <h3 className="catalog-row-title min-w-0 truncate">{title}</h3>
        <CarouselNavButtons
          className="hidden md:flex"
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onPrev={() => scrollByStep(-1)}
          onNext={() => scrollByStep(1)}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      </div>
      <div className="catalog-row-bleed md:hidden">
        <div className={mobileScrollClassName}>{children}</div>
      </div>
      <div className="catalog-row-bleed hidden md:block">
        <ScrollCarousel
          ref={carouselRef}
          ariaLabel={label}
          getPerView={getPerView}
          gap={SCROLL_CAROUSEL_GAP}
          hideArrows
          edgeFade="none"
          pageScroll
          onScrollStateChange={applyScrollState}
        >
          {children}
        </ScrollCarousel>
      </div>
    </section>
  );
}
