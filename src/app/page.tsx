import { HomePageContent } from "@/components/home-page-content";
import { getCatalogData, getCourseBySlug } from "@/lib/catalog/server";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Belajar trading lewat katalog mentor dan kelas terstruktur. Bursa adalah platform edukasi, bukan broker.",
};

export default async function HomePage() {
  const { courses, mentors } = await getCatalogData();

  // Most-enrolled course, fetched with full module/lesson detail for the
  // "Curriculum Preview" section (the listing query omits module payloads).
  const topCourseSlug = [...courses].sort((a, b) => b.studentsCount - a.studentsCount)[0]?.slug;
  const curriculumCourse = topCourseSlug ? await getCourseBySlug(topCourseSlug) : null;
  const curriculumMentor = curriculumCourse
    ? mentors.find((m) => m.slug === curriculumCourse.mentorSlug) ?? null
    : null;

  return (
    <HomePageContent
      courses={courses}
      mentors={mentors}
      curriculumCourse={curriculumCourse}
      curriculumMentor={curriculumMentor}
    />
  );
}
