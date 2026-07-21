"use client";



import { CarouselNavButtons } from "@/components/carousel-nav-buttons";

import { CourseCard } from "@/components/course-card";

import {

  DiscoverInfiniteCarousel,

  type InfiniteCarouselHandle,

} from "@/components/infinite-carousel";

import {

  DISCOVER_MOBILE_PEEK_RATIO,

  SCROLL_CAROUSEL_GAP,

  ScrollCarousel,

  discoverCourseGetScrollPerView,

  peekGetScrollPerView,

  type ScrollCarouselHandle,

} from "@/components/scroll-carousel";

import { useMobileLayout } from "@/hooks/use-mobile-layout";

import type { Course } from "@/lib/types";

import { cn } from "@/lib/utils";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { useCallback, useRef, useState } from "react";



const LANDING_MOBILE_GAP = 10;



interface CourseCarouselProps {

  courses: Course[];

  className?: string;

  /** Total students across the full catalog, surfaced as a real stat in the header. */

  totalStudents?: number;

  /** Hide title block when embedded inside another section (e.g. HomeDiscoverSection). */

  hideHeader?: boolean;

  /** Hide bookmark buttons on cards (landing page). */

  hideBookmark?: boolean;

  /** Match card sizing with mentor carousel inside HomeDiscoverSection. */

  discoverMode?: boolean;

  /** Pause autoplay (e.g. when discover tab is inactive). */

  autoPlayPaused?: boolean;

}



export function CourseCarousel({

  courses,

  className,

  totalStudents,

  hideHeader = false,

  hideBookmark = false,

  discoverMode = false,

  autoPlayPaused = false,

}: CourseCarouselProps) {

  const isMobile = useMobileLayout();

  const desktopCarouselRef = useRef<ScrollCarouselHandle>(null);

  const mobileCarouselRef = useRef<ScrollCarouselHandle>(null);

  const discoverCarouselRef = useRef<InfiniteCarouselHandle>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);



  const applyScrollState = useCallback(

    (state: { canScrollLeft: boolean; canScrollRight: boolean }) => {

      setCanScrollLeft(state.canScrollLeft);

      setCanScrollRight(state.canScrollRight);

    },

    []

  );



  const scrollByStep = useCallback(

    (direction: -1 | 1) => {

      if (discoverMode) {

        discoverCarouselRef.current?.pauseInteraction();

        discoverCarouselRef.current?.nudge(direction === 1 ? -1 : 1);

        return;

      }



      const handle = isMobile ? mobileCarouselRef.current : desktopCarouselRef.current;

      handle?.scrollByStep(direction);

    },

    [discoverMode, isMobile]

  );



  const scrollToIndex = useCallback(

    (index: number) => {

      if (discoverMode) {

        discoverCarouselRef.current?.pauseInteraction();

        discoverCarouselRef.current?.goToIndex(index);

        return;

      }



      const handle = isMobile ? mobileCarouselRef.current : desktopCarouselRef.current;

      handle?.scrollToIndex(index);

    },

    [discoverMode, isMobile]

  );



  if (courses.length === 0) return null;



  const studentStat =

    totalStudents !== undefined && totalStudents > 0

      ? `${totalStudents.toLocaleString("id-ID")}+`

      : null;



  const infiniteScroll = discoverMode && courses.length > 1;

  const navCanScrollLeft = infiniteScroll ? true : canScrollLeft;

  const navCanScrollRight = infiniteScroll ? true : canScrollRight;



  const carouselControls = (

    <CarouselNavButtons

      canScrollLeft={navCanScrollLeft}

      canScrollRight={navCanScrollRight}

      onPrev={() => scrollByStep(-1)}

      onNext={() => scrollByStep(1)}

      prevLabel="Kelas sebelumnya"

      nextLabel="Kelas berikutnya"

    />

  );



  const renderDiscoverCarousel = () => (

    <DiscoverInfiniteCarousel

      ref={discoverCarouselRef}

      items={courses}

      ariaLabel="Ragam kelas di Bursa"

      getPerView={discoverCourseGetScrollPerView}

      gap={isMobile ? LANDING_MOBILE_GAP : SCROLL_CAROUSEL_GAP}

      mobilePeekRatio={DISCOVER_MOBILE_PEEK_RATIO}

      autoPlayPaused={autoPlayPaused}

      onActiveIndexChange={setActiveIndex}

      getItemKey={(course) => course.slug}

      renderItem={(course, index) => (

        <CourseCard

          course={course}

          className="w-full"

          variant="featured"

          isBestseller={index === 0}

          hideBookmark={hideBookmark}

        />

      )}

    />

  );



  return (

    <div

      className={cn(

        "course-carousel-premium relative min-w-0",

        discoverMode && "discover-carousel-panel",

        className

      )}

    >

      {hideHeader ? (

        <div className="relative z-[1] mb-6 flex justify-end sm:mb-8">{carouselControls}</div>

      ) : (

        <div className="relative z-[1] mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">

          <div className="max-w-2xl">

            <p className="eyebrow-tight mb-4">Pilihan Kelas</p>

            <h2 className="section-display-title text-foreground">Kelas Populer</h2>

            <p className="section-copy mt-3 max-w-lg text-base">

              Kurikulum terkurasi dari mentor terverifikasi

              {studentStat && (

                <>

                  {" "}

                  — dipercaya{" "}

                  <span className="font-medium text-foreground">{studentStat} siswa</span>

                </>

              )}

              .

            </p>

            <Link

              href="/katalog"

              className="link-accent mt-4 inline-flex items-center gap-1.5 text-sm font-medium"

            >

              Lihat semua kelas

              <ArrowRight className="size-4" />

            </Link>

          </div>

          {carouselControls}

        </div>

      )}



      {discoverMode ? (

        <div className="relative z-[1] discover-carousel-bleed min-w-0">{renderDiscoverCarousel()}</div>

      ) : (

        <>

          <div className="relative z-[1] landing-carousel-bleed md:hidden">

            <ScrollCarousel

              ref={mobileCarouselRef}

              ariaLabel="Ragam kelas di Bursa"

              hideArrows

              viewportClassName="landing-scroll-carousel"

              getPerView={peekGetScrollPerView}

              gap={LANDING_MOBILE_GAP}

              onScrollStateChange={(state) => {

                if (isMobile) applyScrollState(state);

              }}

              onActiveIndexChange={(index) => {

                if (isMobile) setActiveIndex(index);

              }}

            >

              {courses.map((course, index) => (

                <CourseCard

                  key={course.slug}

                  course={course}

                  className="w-full"

                  variant="featured"

                  isBestseller={index === 0}

                  hideBookmark={hideBookmark}

                />

              ))}

            </ScrollCarousel>

          </div>



          <div className="relative z-[1] landing-carousel-bleed hidden min-w-0 md:block">

            <ScrollCarousel

              ref={desktopCarouselRef}

              ariaLabel="Ragam kelas di Bursa"

              hideArrows

              viewportClassName="landing-scroll-carousel"

              getPerView={discoverCourseGetScrollPerView}

              gap={SCROLL_CAROUSEL_GAP}

              onScrollStateChange={(state) => {

                if (!isMobile) applyScrollState(state);

              }}

              onActiveIndexChange={(index) => {

                if (!isMobile) setActiveIndex(index);

              }}

            >

              {courses.map((course, index) => (

                <CourseCard

                  key={course.slug}

                  course={course}

                  className="w-full"

                  variant="featured"

                  isBestseller={index === 0}

                  hideBookmark={hideBookmark}

                />

              ))}

            </ScrollCarousel>

          </div>

        </>

      )}



      {courses.length > 1 && (

        <div className="relative z-[1] mt-6 flex items-center justify-center gap-3 sm:mt-8">

          <div

            className="flex items-center gap-1.5"

            role="tablist"

            aria-label="Navigasi ragam kelas"

          >

            {courses.map((course, index) => (

              <button

                key={course.slug}

                type="button"

                role="tab"

                aria-selected={index === activeIndex}

                aria-current={index === activeIndex}

                aria-label={`Ke kelas ${index + 1}: ${course.title}`}

                onClick={() => scrollToIndex(index)}

                className="carousel-dot"

              />

            ))}

          </div>

          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">

            {activeIndex + 1}/{courses.length}

          </span>

        </div>

      )}

    </div>

  );

}


