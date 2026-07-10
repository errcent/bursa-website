import { HomePageContent } from "@/components/home-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Belajar trading lewat katalog mentor dan kelas terstruktur. Bursa adalah platform edukasi, bukan broker.",
};

export default function HomePage() {
  return <HomePageContent />;
}
