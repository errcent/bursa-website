"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

const OVERVIEW_STEPS = [
  {
    step: "01",
    title: "Jawab pertanyaan singkat",
    description: "Sekitar 2 menit, fokus instrumen, level, dan tujuan belajarmu.",
  },
  {
    step: "02",
    title: "Dapat jalur belajar personal",
    description: "Ringkasan arah belajar dan langkah yang disarankan untuk profilmu.",
  },
  {
    step: "03",
    title: "Jelajahi kelas & playlist",
    description: "Rekomendasi kelas dan playlist yang selaras, langsung dari katalog Bursa.",
  },
] as const;

export function LearningGuidanceOverviewActions() {
  const { session } = useAuth();
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!session?.userId && !session?.email) {
      setHasSaved(false);
      return;
    }

    const params = new URLSearchParams({
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.email ? { email: session.email } : {}),
    });

    void fetch(`/api/me/learning-guidance?${params}`, {
      cache: "no-store",
      headers: session.email ? { "x-user-email": session.email } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { result: unknown } | null) => {
        setHasSaved(Boolean(data?.result));
      })
      .catch(() => setHasSaved(false));
  }, [session?.email, session?.userId]);

  return (
    <div className="flex flex-col gap-10">
      <ol className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {OVERVIEW_STEPS.map((item) => (
          <li
            key={item.step}
            className="surface-card flex flex-col gap-3 p-5 sm:p-6"
          >
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {item.step}
            </span>
            <h2 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
              {item.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button className="btn-primary h-11 px-6" render={<Link href="/panduan-belajar/quiz" />}>
          Mulai quiz
          <ArrowRight className="size-4 opacity-80" aria-hidden />
        </Button>
        {hasSaved ? (
          <Button
            variant="outline"
            className="h-11"
            render={<Link href="/panduan-belajar/quiz" />}
          >
            <Compass className="size-4 opacity-70" aria-hidden />
            Lihat rekomendasi tersimpan
          </Button>
        ) : null}
      </div>
    </div>
  );
}
