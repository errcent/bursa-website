import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MentorLandingSectionProps {
  mentors: Mentor[];
  className?: string;
}

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",")}jt`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "").replace(".", ",")}rb`;
  }
  return String(value);
}

export function MentorLandingSection({ mentors, className }: MentorLandingSectionProps) {
  if (mentors.length === 0) return null;

  const studentsTotal = mentors.reduce((sum, m) => sum + m.studentsCount, 0);
  const ojkCount = mentors.filter((m) => m.licenseLabel?.includes("OJK")).length;

  return (
    <div className={cn("mentor-landing-section", className)}>
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

        <div className="mentor-landing-header">
          <p className="mentor-landing-eyebrow">Mentor Terverifikasi</p>
          <h2 className="mentor-landing-title">Sosok di balik kelas yang kamu ikuti</h2>
          <p className="mentor-landing-copy">
            Setiap mentor melewati verifikasi kredensial — lisensi WPPE-OJK untuk saham,
            sertifikasi Bappebti untuk kripto — sebelum kelasnya tayang di katalog.
          </p>
          <p className="mentor-landing-stats">
            <ShieldCheck className="size-3.5 text-accent" strokeWidth={2} aria-hidden />
            {mentors.length} mentor · {formatCompactCount(studentsTotal)} murid ·{" "}
            {ojkCount} terdaftar OJK
          </p>
          <Link href="/katalog?view=instruktur" className="mentor-landing-cta">
            Buka katalog mentor
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
