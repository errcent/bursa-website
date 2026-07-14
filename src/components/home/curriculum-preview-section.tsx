"use client";

import Link from "next/link";
import { ArrowRight, Clock, Layers, Lock, PlayCircle } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course, Mentor } from "@/lib/types";

export function CurriculumPreviewSection({
  course,
  mentor,
}: {
  course: Course | null;
  mentor: Mentor | null;
}) {
  if (!course || course.modules.length === 0) return null;

  const moduleCount = course.moduleCount ?? course.modules.length;
  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const previewModules = course.modules.slice(0, 3);
  const remainingModules = Math.max(moduleCount - previewModules.length, 0);

  return (
    <section id="kurikulum-contoh" className="section-tight scroll-mt-24 border-b border-border/60">
      <div className="container-page">
        <Reveal className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Contoh kurikulum</p>
          <h2 className="section-title sm:text-3xl">Begini rasanya belajar terstruktur di Bursa</h2>
          <p className="section-copy mt-2">
            Bukan potongan video acak — setiap kelas dipecah jadi modul dan lesson berurutan.
            Ini contoh nyata dari salah satu kelas paling banyak diikuti.
          </p>
        </Reveal>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          <Reveal className="flex min-w-0 w-full flex-col">
            <div className="surface-card flex h-full min-w-0 w-full max-w-full flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{course.instrument}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold leading-snug sm:text-xl">
                {course.title}
              </h3>
              {mentor ? (
                <p className="mt-1.5 text-sm text-muted-foreground">oleh {mentor.name}</p>
              ) : null}
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {course.shortDescription}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 border-t border-border/50 pt-4 sm:grid-cols-3 sm:gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="size-4 shrink-0 text-accent/80" aria-hidden />
                  <span className="truncate">{moduleCount} modul</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <PlayCircle className="size-4 shrink-0 text-accent/80" aria-hidden />
                  <span className="truncate">{lessonCount} lesson</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4 shrink-0 text-accent/80" aria-hidden />
                  <span className="truncate">{course.durationHours} jam</span>
                </div>
              </div>

              <Button
                className="btn-primary mt-6 h-11 w-full rounded-full sm:w-fit"
                render={<Link href={`/kelas/${course.slug}`} />}
              >
                Lihat kurikulum lengkap
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} y={20} className="min-w-0 w-full">
            <div className="surface-card h-full min-w-0 w-full max-w-full overflow-hidden p-2 sm:p-3">
              <Accordion defaultValue={["preview-module-0"]}>
                {previewModules.map((mod, mi) => (
                  <AccordionItem key={mod.title} value={`preview-module-${mi}`} className="px-3">
                    <AccordionTrigger>
                      <span className="flex min-w-0 items-center gap-2 pr-2 text-left">
                        {mi > 0 ? (
                          <Lock className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                        ) : null}
                        <span className="min-w-0 break-words">
                          {mod.title}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({mod.lessons.length} lesson)
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {mod.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex min-w-0 flex-col gap-1 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <PlayCircle className="size-4 shrink-0" aria-hidden />
                              <span className="min-w-0 break-words text-sm">{lesson.title}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2 sm:ml-2">
                              {lesson.preview ? (
                                <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
                                  Preview Gratis
                                </span>
                              ) : null}
                              <span className="font-mono text-[10px] text-muted-foreground/70">
                                {lesson.durationMinutes}m
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {remainingModules > 0 ? (
                <div className="flex items-center gap-2 border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                  +{remainingModules} modul lainnya · buka penuh di halaman kelas
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
