"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ShieldCheck, Star, Users2 } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { Course, Mentor } from "@/lib/types";
import { cn, formatRating, hasRating } from "@/lib/utils";

interface MentorLandingSectionProps {
  mentors: Mentor[];
  courses: Course[];
  className?: string;
}

const verificationSteps = [
  "Kredensial dan lisensi diperiksa",
  "Kurikulum ditinjau tim",
  "Kepatuhan dicek sebelum tayang",
] as const;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function MentorLandingSection({ mentors, courses, className }: MentorLandingSectionProps) {
  if (mentors.length === 0) return null;

  const totalStudents = courses.reduce((sum, c) => sum + c.studentsCount, 0);
  const ojkCount = mentors.filter((m) => m.licenseLabel?.includes("OJK")).length;
  const ratedCourses = courses.filter((c) => hasRating(c.rating));
  const avgRating = average(ratedCourses.map((c) => c.rating));

  const stats = [
    {
      icon: Users2,
      value: mentors.length.toLocaleString("id-ID"),
      label: "Mentor di katalog",
    },
    {
      icon: Users2,
      value: totalStudents.toLocaleString("id-ID"),
      label: "Siswa terdaftar",
    },
    {
      icon: ShieldCheck,
      value: ojkCount.toLocaleString("id-ID"),
      label: "Terdaftar OJK",
    },
    {
      icon: Star,
      value: avgRating > 0 ? formatRating(avgRating) : "—",
      label: "Rating rata-rata kelas",
    },
  ];

  return (
    <div className={cn("mentor-landing-section", className)}>
      <div className="mentor-landing-header">
        <p className="mentor-landing-eyebrow">Mentor Terverifikasi</p>
        <h2 className="section-title sm:text-3xl">Mentor dicek dulu, baru kelas tayang</h2>
        <p className="mentor-landing-copy">
          Kami verifikasi kredensial, kurikulum, dan kepatuhan — lisensi WPPE-OJK untuk saham,
          sertifikasi Bappebti untuk kripto — sebelum mentor tampil di katalog.
        </p>
      </div>

      <div className="mentor-landing-hero" aria-label="Mentor terverifikasi">
        <Image
          src="/mentors/mentor-landing-group.png"
          alt="Tim mentor terverifikasi Bursa"
          fill
          priority
          sizes="(max-width: 768px) 100vw, min(72rem, 92vw)"
          className="mentor-landing-photo"
        />
        <div className="mentor-landing-fade" aria-hidden />
      </div>

      <Stagger className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <div className="narrative-stat-tile surface-card h-full rounded-xl p-4 sm:p-5">
                <Icon className="size-4 text-accent" aria-hidden />
                <p className="narrative-stat-value stat-value mt-2 text-xl sm:text-3xl">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal className="mt-6 sm:mt-8">
        <div className="surface-card rounded-xl bg-card/60 p-4 sm:p-6">
          <Stagger className="grid gap-2.5 sm:grid-cols-3" delay={0.05}>
            {verificationSteps.map((step) => (
              <StaggerItem key={step}>
                <div className="flex h-full items-center gap-3 rounded-lg border border-border/50 bg-surface/30 px-3 py-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <Check className="size-3 text-accent" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Reveal>

      <Reveal className="mt-6 flex justify-center sm:mt-8">
        <Button
          size="lg"
          className="btn-primary h-12 rounded-full px-8"
          render={<Link href="/katalog?view=instruktur" />}
        >
          Buka katalog mentor
          <ArrowRight className="size-4" />
        </Button>
      </Reveal>
    </div>
  );
}
