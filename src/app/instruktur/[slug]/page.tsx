import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { InstrumentBadge } from "@/components/instrument-badge";
import { CourseCard } from "@/components/course-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getCatalogMentorSlugs,
  getCoursesByMentor,
  getMentorBySlug,
} from "@/lib/catalog/server";
import { resolveMentorAvatarUrl } from "@/lib/mentors/avatar";
import { PreviewCatalogNotice } from "@/components/preview-catalog/preview-catalog-notice";

export async function generateStaticParams() {
  const slugs = await getCatalogMentorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mentor = await getMentorBySlug(slug);
  if (!mentor) return {};
  return {
    title: mentor.name,
    description: mentor.title,
  };
}

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mentor = await getMentorBySlug(slug);
  if (!mentor) notFound();

  const mentorCourses = await getCoursesByMentor(mentor.slug);

  const mentorFirstName = mentor.name.split(",")[0];
  const avatarSrc = resolveMentorAvatarUrl(mentor);

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic border-b border-border">
          <div className="container-page flex flex-col gap-8 py-16 sm:flex-row sm:items-center">
            <Avatar className="size-32 border border-border sm:size-36">
              {avatarSrc ? (
                <AvatarImage
                  src={avatarSrc}
                  alt={`Foto ${mentor.name}`}
                  className="object-cover object-top"
                />
              ) : null}
              <AvatarFallback className="bg-surface-2 text-4xl font-medium">
                {mentor.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {mentor.instruments.map((i) => (
                  <InstrumentBadge key={i} instrument={i} />
                ))}
              </div>
              <p className="text-sm font-medium text-foreground/80">Belajar dengan mentor</p>
              <h1 className="page-hero-title">{mentor.name}</h1>
              <p className="section-copy">
                {mentor.title}. Cocok untuk pelajar yang ingin membangun proses belajar yang lebih
                terstruktur dan konsisten.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button className="btn-primary h-11 px-6 text-sm" render={<Link href={`#kelas-${mentor.slug}`} />}>
                  Pilih Kelas {mentorFirstName}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container-page py-6 sm:py-8">
          <PreviewCatalogNotice />
        </div>

        <div className="container-page flex max-w-3xl flex-col gap-10 py-14">
          <section>
            <h2 className="section-title mb-3">
              Siapa {mentorFirstName} dan cocok untuk siapa
            </h2>
            <p className="section-copy">{mentor.bio}</p>
            <p className="section-copy mt-3">
              Mentor ini biasanya paling cocok untuk pelajar yang ingin fokus pada{" "}
              {mentor.instruments.join(" dan ")}, butuh arahan praktik yang jelas, dan ingin
              berkembang bertahap tanpa terburu-buru.
            </p>
            <blockquote className="mt-4 border-l-2 border-foreground/20 pl-4 text-sm italic leading-relaxed text-foreground/80">
              {mentor.philosophy}
            </blockquote>
          </section>

          <section id={`kelas-${mentor.slug}`}>
            <h2 className="section-title mb-4">
              Kelas yang bisa kamu ambil ({mentorCourses.length})
            </h2>
            {mentorCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {mentorCourses.map((course) => (
                  <CourseCard key={course.slug} course={course} className="w-full" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada kelas yang dipublikasikan.</p>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
