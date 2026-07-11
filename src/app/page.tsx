import { HomePageContent } from "@/components/home-page-content";
import { getCatalogData } from "@/lib/catalog/server";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Belajar trading lewat katalog mentor dan kelas terstruktur. Bursa adalah platform edukasi, bukan broker.",
};

export default async function HomePage() {
  const { courses, mentors } = await getCatalogData();
  return <HomePageContent courses={courses} mentors={mentors} />;
}
