import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { InfoPageHero } from "@/components/info-page-hero";
import { MentorApplicationForm } from "@/components/mentor-program/mentor-application-form";
import { MentorBenefitsSection } from "@/components/mentor-program/mentor-benefits-section";
import { MentorFaqSection } from "@/components/mentor-program/mentor-faq-section";
import { MentorProcessSection } from "@/components/mentor-program/mentor-process-section";
import { MentorRequirementsSection } from "@/components/mentor-program/mentor-requirements-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PLATFORM_COMMISSION_RATE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Jadi Mentor",
  description:
    "Daftar sebagai mentor di Bursa Trading Academy. Bagikan keahlian tradingmu, dapatkan pendapatan langsung, dan akses infrastruktur kelas lengkap.",
};

export default function JadiMentorPage() {
  const commissionPercent = PLATFORM_COMMISSION_RATE * 100;

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow="Program Mentor"
          title="Jadi Mentor di Bursa"
          description={`Bagikan keahlian tradingmu ke ribuan pelajar. Kamu fokus mengajar — kami urus infrastruktur, pembayaran, dan kepercayaan. Komisi platform hanya ${commissionPercent}%.`}
        />

        <div className="container-page section-spacious">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Sudah punya akun Bursa?{" "}
                <Link href="/masuk?next=/jadi-mentor" className="link-muted font-medium text-foreground">
                  Masuk dulu
                </Link>{" "}
                agar data profil terisi otomatis di formulir.
              </p>
            </div>
            <Button
              className="btn-primary shrink-0"
              render={<a href="#formulir" />}
            >
              Langsung ke formulir
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <MentorBenefitsSection />

          <Separator className="my-14 opacity-60" />

          <MentorRequirementsSection />

          <Separator className="my-14 opacity-60" />

          <MentorProcessSection />

          <Separator className="my-14 opacity-60" />

          <MentorFaqSection />

          <Separator className="my-14 opacity-60" />

          <section id="formulir" className="scroll-mt-24">
            <p className="eyebrow mb-2">Formulir pendaftaran</p>
            <h2 className="section-title">Ajukan diri sebagai mentor</h2>
            <p className="section-copy mt-2 max-w-2xl">
              Isi formulir di bawah. Tim kurasi akan menghubungi dalam 3–5 hari kerja jika profilmu
              sesuai kriteria.
            </p>

            <div className="surface-card mt-8 p-6 sm:p-8">
              <MentorApplicationForm />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
