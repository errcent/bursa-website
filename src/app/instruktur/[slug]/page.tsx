import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, GraduationCap, Star, Users } from "lucide-react";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { VerifiedBadge } from "@/components/verified-badge";
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
import { formatRating } from "@/lib/utils";

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

  const statCards = [
    { icon: Users, label: "Total Siswa", value: mentor.studentsCount.toLocaleString("id-ID") },
    { icon: Star, label: "Rating Agregat", value: formatRating(mentor.rating) },
    { icon: GraduationCap, label: "Jumlah Kelas", value: String(mentor.coursesCount) },
    { icon: Calendar, label: "Pengalaman", value: `${mentor.yearsExperience} tahun` },
  ];
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
                {mentor.availableFor1on1 && (
                  <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
                    Tersedia untuk Sesi 1-on-1
                  </span>
                )}
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
                {mentor.availableFor1on1 && (
                  <Button variant="outline" render={<Link href={`/instruktur/${mentor.slug}/sesi`} />}>
                    Tanya Sesi 1-on-1 · {mentor.sessionPrice}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container-page grid gap-10 py-14 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-10">
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

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="section-title">Ringkasan pendekatan belajar</h2>
                <span className="text-xs text-muted-foreground">Data profil mentor</span>
              </div>
              <div className="surface-card p-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                  <li className="rounded-lg border border-border/60 bg-surface/40 p-3">
                    <p className="text-xs text-muted-foreground">Instrumen utama</p>
                    <p className="mt-1 text-sm font-medium">{mentor.instruments.join(" · ")}</p>
                  </li>
                  <li className="rounded-lg border border-border/60 bg-surface/40 p-3">
                    <p className="text-xs text-muted-foreground">Pengalaman</p>
                    <p className="mt-1 text-sm font-medium">{mentor.yearsExperience} tahun</p>
                  </li>
                  <li className="rounded-lg border border-border/60 bg-surface/40 p-3">
                    <p className="text-xs text-muted-foreground">Kelas aktif</p>
                    <p className="mt-1 text-sm font-medium">{mentorCourses.length} kelas</p>
                  </li>
                  <li className="rounded-lg border border-border/60 bg-surface/40 p-3">
                    <p className="text-xs text-muted-foreground">Status verifikasi</p>
                    <p className="mt-1 text-sm font-medium">
                      {mentor.verified ? "Terverifikasi tim compliance" : "Dalam proses review tim"}
                    </p>
                  </li>
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Fokus utama di kelas mentor ini adalah proses: memahami konteks, latihan terarah,
                  lalu evaluasi berkala. Halaman profil menampilkan data kapasitas mentor, bukan
                  grafik performa trading.
                </p>
              </div>
            </section>

            <section id={`kelas-${mentor.slug}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">
                  Kelas yang bisa kamu ambil ({mentorCourses.length})
                </h2>
                <Button className="btn-primary" render={<Link href={`#kelas-${mentor.slug}`} />}>
                  Lihat dan pilih kelas
                </Button>
              </div>
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

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <div className="surface-card border-accent/25 bg-accent-soft/30 p-5 shadow-[0_0_32px_var(--glow)]">
              <h3 className="font-heading text-base font-semibold">Mulai dari kelas mentor</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih kelas sesuai levelmu, lalu lanjutkan dengan pendampingan 1-on-1 jika perlu.
              </p>
              <Button className="btn-primary mt-4 w-full" render={<Link href={`#kelas-${mentor.slug}`} />}>
                Ambil Kelas {mentorFirstName}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="surface-card p-4">
                  <stat.icon className="size-4 text-accent" />
                  <p className="stat-value mt-2">{stat.value}</p>
                  <p className="stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="surface-card p-5">
              <h3 className="text-sm font-medium">Status review tim</h3>
              <div className="mt-3">
                <VerifiedBadge
                  verified={mentor.verified}
                  label={mentor.licenseLabel ?? (mentor.verified ? "Dipublikasikan" : "Review Tim")}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Informasi ini membantu validasi profil mentor, namun keputusan belajar tetap
                sebaiknya didasarkan pada kecocokan pendekatan dan kebutuhanmu.
              </p>
            </div>
            {mentor.availableFor1on1 && (
              <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-5">
                <h3 className="font-heading text-sm font-medium text-emerald">Sesi 1-on-1</h3>
                <p className="mt-1 text-sm text-muted-foreground">{mentor.sessionPrice}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Diskusikan portofolio atau strategi tradingmu secara personal. Pembayaran
                  ditahan (escrow) hingga sesi terkonfirmasi selesai.
                </p>
                <Button className="mt-4 w-full" variant="outline" render={<Link href={`/instruktur/${mentor.slug}/sesi`} />}>
                  Lihat Jadwal Tersedia
                </Button>
              </div>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
