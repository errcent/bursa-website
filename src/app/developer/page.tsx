"use client";

import Link from "next/link";
import { BookOpen, Eye, Shield, UserRound } from "lucide-react";

const qcTargets = [
  {
    href: "/admin",
    title: "Admin Panel",
    description: "Tinjau CRUD courses, mentors, users, dan moderasi.",
    icon: Shield,
    note: "View-only QC. Jangan mengubah data produksi tanpa admin.",
  },
  {
    href: "/mentor",
    title: "Mentor Panel",
    description: "Periksa UX ringkasan, profil, pengaturan, dan usulan konten.",
    icon: UserRound,
    note: "Komunitas/chat diarsipkan. Tidak ada Group Chat di live.",
  },
  {
    href: "/",
    title: "Learner experience",
    description: "Browse beranda, katalog, dashboard, dan alur belajar.",
    icon: Eye,
    note: "Pengalaman member/publik seperti biasa.",
  },
  {
    href: "/developer/docs",
    title: "Developer Docs",
    description: "Arsitektur, auth/roles, modul kunci, dan catatan arsip komunitas.",
    icon: BookOpen,
    note: "Wajib dibaca onboarding developer baru.",
  },
];

export default function DeveloperQcPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Quality Control Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Developer dapat membuka panel pengguna untuk QA visual dan alur. Fitur komunitas/chat
          diarsipkan di <code className="text-xs">Website/_archive/komunitas/</code>.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {qcTargets.map((target) => {
          const Icon = target.icon;
          return (
            <Link
              key={target.href}
              href={target.href}
              className="surface-card-hover flex flex-col gap-3 p-5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h2 className="font-heading text-sm font-semibold">{target.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{target.description}</p>
              <p className="mt-auto text-[11px] text-amber-600 dark:text-amber-400">{target.note}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
