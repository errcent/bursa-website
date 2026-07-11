"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Users2 } from "lucide-react";
import { motion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useAuth } from "@/components/auth-provider";
import { DeviceOrbit } from "@/components/ui/orbit-visuals";
import { Button } from "@/components/ui/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import type { Course, Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

const verificationSteps = [
  { label: "Kredensial dan lisensi diperiksa", done: true },
  { label: "Kurikulum ditinjau tim", done: true },
  { label: "Pemeriksaan kepatuhan sebelum tayang", done: true },
];

/* ── Shared layout ── */

function NarrativeBlock({
  eyebrow,
  title,
  copy,
  visual,
  reverse = false,
  muted = false,
  spacing = "base",
}: {
  eyebrow: string;
  title: string;
  copy: string;
  visual: React.ReactNode;
  reverse?: boolean;
  muted?: boolean;
  spacing?: "tight" | "base" | "loose";
}) {
  return (
    <section
      className={cn(
        "border-b border-border/60",
        spacing === "tight" && "section-tight",
        spacing === "base" && "section-spacious",
        spacing === "loose" && "section-loose",
        muted && "section-muted"
      )}
    >
      <div className="container-page">
        <div
          className={cn(
            "grid items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-14",
            reverse && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"
          )}
        >
          <Reveal className="max-w-lg">
            <p className="eyebrow mb-3">{eyebrow}</p>
            <h2 className="section-title sm:text-3xl">{title}</h2>
            <p className="section-copy mt-3">{copy}</p>
          </Reveal>
          <Reveal delay={0.12} y={20}>
            {visual}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Visual: Verification stats + checklist ── */

function VerificationVisual({
  courses,
  mentors,
  verifiedMentors,
}: {
  courses: Course[];
  mentors: Mentor[];
  verifiedMentors: Mentor[];
}) {
  const verifyRate = mentors.length > 0 ? Math.round((verifiedMentors.length / mentors.length) * 100) : 0;

  return (
    <div className="narrative-visual-card surface-card bg-card/60 p-4 sm:p-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="narrative-stat-tile rounded-xl border border-border/60 bg-surface/40 p-4">
          <ShieldCheck className="size-4 text-accent" aria-hidden />
          <p className="narrative-stat-value stat-value mt-2 text-xl sm:text-3xl">{mentors.length}</p>
          <p className="stat-label">Mentor di katalog</p>
        </div>
        <div className="narrative-stat-tile rounded-xl border border-accent/20 bg-accent-soft/30 p-4">
          <Users2 className="size-4 text-accent" aria-hidden />
          <p className="narrative-stat-value stat-value mt-2 text-xl sm:text-3xl">{verifiedMentors.length}</p>
          <p className="stat-label">Sudah terverifikasi</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">Tinjauan sebelum tayang</span>
          <span className="font-mono font-medium text-accent">{verifyRate}%</span>
        </div>
        <Progress value={verifyRate} className="gap-0">
          <ProgressTrack className="h-2 bg-muted/80">
            <ProgressIndicator className="bg-accent" />
          </ProgressTrack>
        </Progress>
      </div>

      <Stagger className="mt-6 space-y-2.5" delay={0.1}>
        {verificationSteps.map((step) => (
          <StaggerItem key={step.label}>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface/30 px-3 py-2.5">
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
  );
}

/* ── Visual: User learning paths orbit ── */

function LearningPathsVisual({
  courses,
  mentors,
  learningPathTracks,
  totalModules,
  totalDurationHours,
}: {
  courses: Course[];
  mentors: Mentor[];
  learningPathTracks: { label: string; count: number; tone: string }[];
  totalModules: number;
  totalDurationHours: number;
}) {
  const maxTrack = Math.max(...learningPathTracks.map((item) => item.count), 1);

  return (
    <div className="narrative-visual-card surface-card bg-card/60 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Peta minat belajar pengguna
        </p>
        <span className="rounded-full border border-border/60 bg-surface/40 px-3 py-1 font-mono text-[10px] text-muted-foreground">
          {courses.length} kelas aktif
        </span>
      </div>

      <div className="mt-6 space-y-3.5">
        {learningPathTracks.map((item) => {
          const percent = Math.max((item.count / maxTrack) * 100, 16);
          return (
            <div key={item.label} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,11rem)_1fr_auto]">
              <p className="text-xs text-muted-foreground sm:text-sm">{item.label}</p>
              <div className="h-2.5 rounded-full bg-muted/70">
                <div className={cn("h-full rounded-full", item.tone)} style={{ width: `${percent}%` }} />
              </div>
              <p className="font-mono text-[11px] text-foreground/85">{item.count}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="narrative-stat-tile rounded-xl border border-border/60 bg-surface/30 p-4">
          <p className="narrative-stat-value font-heading text-base font-semibold tracking-tight sm:text-lg">{totalModules}</p>
          <p className="stat-label">Total modul terstruktur</p>
        </div>
        <div className="narrative-stat-tile rounded-xl border border-border/60 bg-surface/30 p-4">
          <p className="narrative-stat-value font-heading text-base font-semibold tracking-tight sm:text-lg">{Math.round(totalDurationHours)}j</p>
          <p className="stat-label">Durasi belajar</p>
        </div>
        <div className="narrative-stat-tile rounded-xl border border-border/60 bg-surface/30 p-4">
          <p className="narrative-stat-value font-heading text-base font-semibold tracking-tight sm:text-lg">{mentors.length}</p>
          <p className="stat-label">Mentor aktif</p>
        </div>
      </div>
    </div>
  );
}

/* ── Visual: Learn anywhere devices + access stats ── */

function LearnAnywhereVisual({
  totalModules,
  totalDurationHours,
  totalStudents,
}: {
  totalModules: number;
  totalDurationHours: number;
  totalStudents: number;
}) {
  return (
    <div className="narrative-visual-card surface-card bg-card/60 p-4 sm:p-8">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:mb-6">
        Studi lintas perangkat
      </p>
      <div className="hidden md:block">
        <DeviceOrbit />
      </div>
      <p className="rounded-xl border border-border/50 bg-surface/30 px-4 py-3 text-center text-sm text-muted-foreground md:hidden">
        Materi dan progres belajar dapat diakses dari ponsel atau desktop kapan saja.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border/50 pt-5 sm:mt-8 sm:grid-cols-3 sm:pt-6">
        <div className="text-center">
          <p className="narrative-stat-value font-heading text-base font-semibold sm:text-xl">24/7</p>
          <p className="stat-label mt-0.5">Akses materi</p>
        </div>
        <div className="text-center">
          <p className="narrative-stat-value font-heading text-base font-semibold sm:text-xl">{totalModules}</p>
          <p className="stat-label mt-0.5">Modul</p>
        </div>
        <div className="text-center">
          <p className="narrative-stat-value font-heading text-base font-semibold sm:text-xl">{totalDurationHours}j</p>
          <p className="stat-label mt-0.5">Konten video</p>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground/70">
        {Math.round(totalStudents / 1000)}rb+ pendaftaran kelas
      </p>
    </div>
  );
}

/* ── Main export: 3 narrative blocks ── */

export function NarrativeScrollSections({
  courses,
  mentors,
}: {
  courses: Course[];
  mentors: Mentor[];
}) {
  const verifiedMentors = mentors.filter((m) => m.verified);
  const totalModules = courses.reduce(
    (sum, c) => sum + (c.moduleCount ?? c.modules.length),
    0
  );
  const totalDurationHours = courses.reduce((sum, c) => sum + c.durationHours, 0);
  const totalStudents = courses.reduce((sum, c) => sum + c.studentsCount, 0);

  const learningPathTracks = [
    { label: "Level pemula", count: courses.filter((c) => c.level === "Pemula").length, tone: "bg-accent/85" },
    { label: "Level menengah", count: courses.filter((c) => c.level === "Menengah").length, tone: "bg-foreground/45" },
    { label: "Saham", count: courses.filter((c) => c.instrument === "Saham").length, tone: "bg-emerald/85" },
    { label: "Crypto", count: courses.filter((c) => c.instrument === "Crypto").length, tone: "bg-accent/65" },
    { label: "Forex", count: courses.filter((c) => c.instrument === "Forex").length, tone: "bg-amber-300/70" },
    { label: "Sesi mentor langsung", count: mentors.length, tone: "bg-foreground/55" },
  ];

  return (
    <>
      <NarrativeBlock
        eyebrow="Verifikasi"
        title="Mentor dicek dulu, baru kelas tayang"
        copy="Kami cek kredensial, kurikulum, dan aspek kepatuhan dulu. Mentor baru tampil setelah lolos review."
        visual={
          <VerificationVisual
            courses={courses}
            mentors={mentors}
            verifiedMentors={verifiedMentors}
          />
        }
        spacing="loose"
      />

      <NarrativeBlock
        eyebrow="Jalur belajar"
        title="Banyak pilihan, kamu yang tentukan arahnya"
        copy="Trading bukan cuma soal strategi — juga soal tahu diri sendiri. Di Bursa kamu bisa mulai dari level pemula atau menengah, pilih saham crypto atau forex, belajar mandiri lewat modul atau bareng mentor. Jelajahi dulu sampai ketemu yang pas buat kamu."
        visual={
          <LearningPathsVisual
            courses={courses}
            mentors={mentors}
            learningPathTracks={learningPathTracks}
            totalModules={totalModules}
            totalDurationHours={totalDurationHours}
          />
        }
        reverse
        muted
        spacing="tight"
      />

      <NarrativeBlock
        eyebrow="Akses fleksibel"
        title="Lanjutkan belajar kapan pun"
        copy="Akses modul dari desktop atau mobile kapan saja. Lanjut dari progres terakhirmu."
        visual={
          <LearnAnywhereVisual
            totalModules={totalModules}
            totalDurationHours={totalDurationHours}
            totalStudents={totalStudents}
          />
        }
        spacing="base"
      />
    </>
  );
}

/* ── Closing CTA ── */

export function NarrativeClosingCta() {
  const { session, isLoading } = useAuth();
  const isMember = Boolean(session);

  return (
    <section className="relative overflow-hidden border-b border-border/60 py-16 sm:py-20 md:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, var(--glow), transparent 70%)",
        }}
      />
      <div className="container-page relative z-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Siap mulai?</p>
          <h2 className="section-title sm:text-3xl md:text-4xl">
            Temukan kelas yang cocok di katalog
          </h2>
          <p className="section-copy mx-auto mt-4 max-w-lg">
            {isMember
              ? "Bandingkan kurikulum, level, dan profil mentor. Lanjutkan belajar dari dashboard kamu."
              : "Bandingkan kurikulum, level, dan profil mentor. Daftar gratis untuk simpan progres belajar."}
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="btn-primary h-12 w-full rounded-full px-8 sm:w-auto"
                render={<Link href="/katalog" />}
              >
                Lihat Katalog
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
            {!isLoading && !isMember ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-card/40 px-7 text-sm"
                render={<Link href="/daftar" />}
              >
                Daftar gratis
              </Button>
            ) : null}
            {!isLoading && isMember ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-card/40 px-7 text-sm"
                render={<Link href="/dashboard" />}
              >
                Lanjut Belajar
              </Button>
            ) : null}
          </div>

          <p className="mt-6 font-mono text-[10px] text-muted-foreground/60">
            Bayar hanya saat ambil kelas. Tanpa langganan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
