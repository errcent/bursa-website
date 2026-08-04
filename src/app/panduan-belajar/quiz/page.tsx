import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LearningGuidanceQuiz } from "@/components/learning-guidance/learning-guidance-quiz";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata: Metadata = {
  title: "Quiz Panduan Belajar",
  description: "Jawab pertanyaan singkat untuk rekomendasi kelas dan mentor yang selaras.",
};

export default function PanduanBelajarQuizPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="container-page section-tight pt-6 sm:pt-8">
          <Link
            href="/panduan-belajar"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Kembali ke overview
          </Link>
          <LearningGuidanceQuiz />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
