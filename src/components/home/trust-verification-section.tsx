"use client";

import { Check, ShieldCheck, Star, Users2 } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import type { Course, Mentor } from "@/lib/types";
import { formatRating } from "@/lib/utils";

const verificationSteps = [
  { label: "Kredensial dan lisensi diperiksa", done: true },
  { label: "Kurikulum ditinjau tim", done: true },
  { label: "Pemeriksaan kepatuhan sebelum tayang", done: true },
];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function TrustVerificationSection({
  courses,
  mentors,
}: {
  courses: Course[];
  mentors: Mentor[];
}) {
  const verifiedMentors = mentors.filter((m) => m.verified);
  const verifyRate = mentors.length > 0 ? Math.round((verifiedMentors.length / mentors.length) * 100) : 0;
  const totalStudents = courses.reduce((sum, c) => sum + c.studentsCount, 0);
  const avgRating = average(courses.map((c) => c.rating));

  const stats = [
    {
      icon: Users2,
      value: mentors.length.toLocaleString("id-ID"),
      label: "Mentor di katalog",
    },
    {
      icon: ShieldCheck,
      value: `${verifyRate}%`,
      label: "Sudah terverifikasi",
    },
    {
      icon: Users2,
      value: totalStudents.toLocaleString("id-ID"),
      label: "Siswa terdaftar",
    },
    {
      icon: Star,
      value: avgRating > 0 ? formatRating(avgRating) : "—",
      label: "Rating rata-rata kelas",
    },
  ];

  return (
    <section className="section-spacious border-b border-border/60">
      <div className="container-page">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow mb-3">Kepercayaan &amp; verifikasi</p>
          <h2 className="section-title sm:text-3xl">Mentor dicek dulu, baru kelas tayang</h2>
          <p className="section-copy mx-auto mt-3 max-w-xl">
            Kami cek kredensial, kurikulum, dan aspek kepatuhan dulu. Mentor baru tampil di katalog
            setelah lolos review — angka di bawah dihitung langsung dari katalog aktif.
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
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

        <div className="narrative-visual-card surface-card mt-6 bg-card/60 p-4 sm:mt-8 sm:p-8">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground">Tinjauan sebelum tayang</span>
            <span className="font-mono font-medium text-accent">{verifyRate}%</span>
          </div>
          <Progress value={verifyRate} className="gap-0">
            <ProgressTrack className="h-2 bg-muted/80">
              <ProgressIndicator className="bg-accent" />
            </ProgressTrack>
          </Progress>

          <Stagger className="mt-6 grid gap-2.5 sm:grid-cols-3" delay={0.1}>
            {verificationSteps.map((step) => (
              <StaggerItem key={step.label}>
                <div className="flex h-full items-center gap-3 rounded-lg border border-border/50 bg-surface/30 px-3 py-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <Check className="size-3 text-accent" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-muted-foreground">{step.label}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-foreground/70">
            {courses.length} kelas di katalog · {mentors.length - verifiedMentors.length} mentor
            menunggu verifikasi
          </p>
        </div>
      </div>
    </section>
  );
}
