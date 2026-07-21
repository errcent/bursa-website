"use client";



import { useCallback, useRef, useState } from "react";



import { CarouselNavButtons } from "@/components/carousel-nav-buttons";

import { MentorCard } from "@/components/mentor-card";

import {

  DiscoverInfiniteCarousel,

  type InfiniteCarouselHandle,

} from "@/components/infinite-carousel";

import {

  DISCOVER_MOBILE_PEEK_RATIO,

  SCROLL_CAROUSEL_GAP,

  ScrollCarousel,

  discoverMentorGetScrollPerView,

  mentorGetScrollPerView,

  peekGetScrollPerView,

  type ScrollCarouselHandle,

} from "@/components/scroll-carousel";

import { useMobileLayout } from "@/hooks/use-mobile-layout";

import type { Mentor } from "@/lib/types";

import { cn } from "@/lib/utils";



const LANDING_MOBILE_GAP = 12;



interface MentorCarouselProps {

  mentors: Mentor[];

  className?: string;

  hideControls?: boolean;

  /** Hide bookmark buttons on cards (landing page). */

  hideBookmark?: boolean;

  /** Match card sizing with course carousel inside HomeDiscoverSection. */

  discoverMode?: boolean;

  /** Pause autoplay (e.g. when discover tab is inactive). */

  autoPlayPaused?: boolean;

}



export function MentorCarousel({

  mentors,

  className,

  hideControls = false,

  hideBookmark = false,

  discoverMode = false,

  autoPlayPaused = false,

}: MentorCarouselProps) {

  const isMobile = useMobileLayout();

  const desktopCarouselRef = useRef<ScrollCarouselHandle>(null);

  const mobileCarouselRef = useRef<ScrollCarouselHandle>(null);

  const discoverCarouselRef = useRef<InfiniteCarouselHandle>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);



  const featuredMentors = [...mentors]

    .sort((a, b) => b.studentsCount - a.studentsCount)

    .slice(0, 8);



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



  if (featuredMentors.length === 0) return null;



  const infiniteScroll = discoverMode && featuredMentors.length > 1;

  const navCanScrollLeft = infiniteScroll ? true : canScrollLeft;

  const navCanScrollRight = infiniteScroll ? true : canScrollRight;



  const controls = hideControls ? null : (

    <CarouselNavButtons

      canScrollLeft={navCanScrollLeft}

      canScrollRight={navCanScrollRight}

      onPrev={() => scrollByStep(-1)}

      onNext={() => scrollByStep(1)}

      prevLabel="Mentor sebelumnya"

      nextLabel="Mentor berikutnya"

    />

  );



  const renderDiscoverCarousel = () => (

    <DiscoverInfiniteCarousel

      ref={discoverCarouselRef}

      items={featuredMentors}

      ariaLabel="Ragam mentor di Bursa"

      getPerView={discoverMentorGetScrollPerView}

      gap={isMobile ? LANDING_MOBILE_GAP : SCROLL_CAROUSEL_GAP}

      mobilePeekRatio={DISCOVER_MOBILE_PEEK_RATIO}

      autoPlayPaused={autoPlayPaused}

      onActiveIndexChange={setActiveIndex}

      getItemKey={(mentor) => mentor.slug}

      renderItem={(mentor) => (

        <MentorCard

          mentor={mentor}

          className="w-full"

          variant="discover"

          hideBookmark={hideBookmark}

        />

      )}

    />

  );



  return (

    <div

      className={cn(

        "mentor-carousel-premium relative min-w-0",

        discoverMode && "discover-carousel-panel",

        className

      )}

    >

      {!hideControls ? <div className="mb-6 flex justify-end sm:mb-8">{controls}</div> : null}



      {discoverMode ? (

        <div className="relative z-[1] discover-carousel-bleed min-w-0">{renderDiscoverCarousel()}</div>

      ) : (

        <>

          <div className="relative z-[1] landing-carousel-bleed md:hidden">

            <ScrollCarousel

              ref={mobileCarouselRef}

              ariaLabel="Ragam mentor di Bursa"

              hideArrows

              viewportClassName="landing-scroll-carousel"

              getPerView={peekGetScrollPerView}

              gap={LANDING_MOBILE_GAP}

              fixedItemWidth="42%"

              onScrollStateChange={(state) => {

                if (isMobile) applyScrollState(state);

              }}

              onActiveIndexChange={(index) => {

                if (isMobile) setActiveIndex(index);

              }}

            >

              {featuredMentors.map((mentor) => (

                <MentorCard

                  key={mentor.slug}

                  mentor={mentor}

                  className="w-full"

                  variant="default"

                  hideBookmark={hideBookmark}

                />

              ))}

            </ScrollCarousel>

          </div>



          <div className="relative z-[1] landing-carousel-bleed hidden min-w-0 md:block">

            <ScrollCarousel

              ref={desktopCarouselRef}

              ariaLabel="Ragam mentor di Bursa"

              hideArrows

              viewportClassName="landing-scroll-carousel"

              getPerView={mentorGetScrollPerView}

              gap={SCROLL_CAROUSEL_GAP}

              onScrollStateChange={(state) => {

                if (!isMobile) applyScrollState(state);

              }}

              onActiveIndexChange={(index) => {

                if (!isMobile) setActiveIndex(index);

              }}

            >

              {featuredMentors.map((mentor) => (

                <MentorCard

                  key={mentor.slug}

                  mentor={mentor}

                  className="w-full"

                  variant="default"

                  hideBookmark={hideBookmark}

                />

              ))}

            </ScrollCarousel>

          </div>

        </>

      )}



      {featuredMentors.length > 1 ? (

        <div className="relative z-[1] mt-6 flex items-center justify-center gap-3 sm:mt-8">

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Navigasi ragam mentor">

            {featuredMentors.map((mentor, index) => (

              <button

                key={mentor.slug}

                type="button"

                role="tab"

                aria-selected={index === activeIndex}

                aria-current={index === activeIndex}

                aria-label={`Ke mentor ${index + 1}: ${mentor.name}`}

                onClick={() => scrollToIndex(index)}

                className="carousel-dot"

              />

            ))}

          </div>

          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">

            {activeIndex + 1}/{featuredMentors.length}

          </span>

        </div>

      ) : null}

    </div>

  );

}


