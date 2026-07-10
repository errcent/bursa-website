import type { Metadata } from "next";

import { HelpCenterContent } from "@/components/help-center/help-center-content";
import { InfoPageHero } from "@/components/info-page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata: Metadata = {
  title: "Pusat Bantuan",
  description:
    "FAQ dan panduan Bursa — akun, pembayaran, belajar, komunitas, dan program mentor. Hubungi support jika pertanyaanmu belum terjawab.",
};

export default function BantuanPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow="Dukungan"
          title="Pusat Bantuan"
          description="Jawaban cepat seputar akun, pembayaran, proses belajar, komunitas, dan program mentor. Tidak menemukan jawaban? Tim kami siap membantu."
        />

        <div className="container-page section-spacious">
          <HelpCenterContent />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
