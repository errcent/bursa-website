import Image from "next/image";

import { WordReveal } from "@/components/motion/word-reveal";

export function DeviceMockupSection() {
  return (
    <section
      id="belajar-dimana-saja"
      className="section-cinematic-light section-tight scroll-mt-24"
      aria-labelledby="device-mockup-heading"
    >
      <div className="container-page">
        <div className="mx-auto mb-6 max-w-3xl text-center md:mb-8">
          <h2 id="device-mockup-heading" className="section-display-title text-foreground">
            <WordReveal
              as="span"
              className="inline"
              text="Belajar sederhana, di mana saja"
              trigger="inView"
              delay={0.04}
            />
          </h2>
        </div>

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
