"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { WordReveal } from "@/components/motion/word-reveal";

const INTRO_EASE = [0.16, 1, 0.3, 1] as const;

export function DeviceMockupSection() {
  const trackRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const topY = useTransform(scrollYProgress, [0.42, 0.58, 0.84], ["0vh", "-12vh", "-42vh"]);
  const topOpacity = useTransform(scrollYProgress, [0.5, 0.74], [1, 0]);
  const bottomY = useTransform(scrollYProgress, [0.42, 0.58, 0.76], ["0vh", "-7vh", "-16vh"]);
  const bottomOpacity = useTransform(scrollYProgress, [0.42, 0.58, 0.72], [1, 0.28, 0]);
  const mockupScale = useTransform(scrollYProgress, [0.12, 0.4, 1], [1, 1.18, 1.18]);

  return (
    <section
      ref={trackRef}
      id="belajar-dimana-saja"
      className="device-mockup-scroll-track scroll-mt-24"
      aria-labelledby="device-mockup-heading"
    >
      <div className="device-mockup-sticky">
        <div className="device-mockup-sticky__inner container-page">
          <h2 id="device-mockup-heading" className="device-mockup-heading">
            <motion.span
              className="device-mockup-line device-mockup-line--top section-display-title text-foreground"
              style={reduceMotion ? undefined : { y: topY, opacity: topOpacity }}
            >
              <WordReveal
                as="span"
                className="inline"
                text="Belajar sederhana"
                trigger="inView"
                delay={0.08}
              />
            </motion.span>
            <motion.span
              className="device-mockup-line device-mockup-line--bottom section-display-title text-foreground"
              style={reduceMotion ? undefined : { y: bottomY, opacity: bottomOpacity }}
            >
              <WordReveal
                as="span"
                className="inline"
                text="di mana saja"
                trigger="inView"
                delay={0.55}
              />
            </motion.span>
          </h2>

          <motion.div
            className="device-mockup-stage"
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{
              duration: 1.55,
              delay: 0.2,
              ease: INTRO_EASE,
            }}
          >
            <motion.div
              className="device-mockup-stage__grow"
              style={reduceMotion ? undefined : { scale: mockupScale }}
            >
              <div className="device-mockup-stage__frame">
                <Image
                  src="/mockups/mockup_2-device.png"
                  alt="Tampilan Bursa di laptop dan ponsel: katalog kelas di desktop dan ruang belajar di mobile."
                  width={3072}
                  height={2844}
                  className="device-mockup-stage__img"
                  sizes="(max-width: 768px) 70vw, 52vw"
                  priority={false}
                  draggable={false}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
