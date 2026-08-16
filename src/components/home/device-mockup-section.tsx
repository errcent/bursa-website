import Image from "next/image";

import { WordReveal } from "@/components/motion/word-reveal";

export function DeviceMockupSection() {
  return (
    <section
      id="belajar-dimana-saja"
      className="section-cinematic-light flex min-h-[100svh] scroll-mt-24 items-center"
      aria-labelledby="device-mockup-heading"
    >
      <div className="container-page flex w-full flex-col items-center py-24 sm:py-28 md:py-32">
        <h2
          id="device-mockup-heading"
          className="section-display-title mb-16 max-w-3xl text-center text-foreground sm:mb-20 md:mb-24"
        >
          <span className="block md:inline">
            <WordReveal
              as="span"
              className="inline"
              text="Belajar sederhana,"
              trigger="inView"
              delay={0.04}
            />
          </span>
          <span className="hidden md:inline"> </span>
          <span className="block md:inline">
            <WordReveal
              as="span"
              className="inline"
              text="di mana saja"
              trigger="inView"
              delay={0.22}
            />
          </span>
        </h2>

        <div className="mx-auto w-[60%]">
          <Image
            src="/mockups/laptop-phone-transparent.png"
            alt="Tampilan Bursa di laptop dan ponsel: katalog kelas di desktop dan ruang belajar di mobile."
            width={1024}
            height={948}
            className="mx-auto h-auto w-full"
            sizes="60vw"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
