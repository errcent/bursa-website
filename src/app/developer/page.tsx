"use client";

import Link from "next/link";
import {
  BookOpen,
  Eye,
  Lock,
  MessageSquare,
  Shield,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockRooms } from "@/lib/chat/mock-chat-data";
import { filterRoomsForRole, isPrivateMentorRoom } from "@/lib/chat/access";

const qcTargets = [
  {
    href: "/admin",
    title: "Admin Panel",
    description: "Tinjau CRUD courses, mentors, users, chat rooms, dan moderasi.",
    icon: Shield,
    note: "View-only QC — jangan mengubah data produksi tanpa admin.",
  },
  {
    href: "/mentor",
    title: "Mentor Panel",
    description: "Periksa UX ringkasan, profil, pengaturan, dan daftar group chat.",
    icon: UserRound,
    note: "Cabang privat mentor & chat staf tetap terkunci.",
  },
  {
    href: "/",
    title: "Learner experience",
    description: "Browse beranda, katalog, dashboard, dan komunitas publik.",
    icon: Eye,
    note: "Pengalaman member/publik seperti biasa.",
  },
  {
    href: "/developer/docs",
    title: "Developer Docs",
    description: "Arsitektur, auth/roles, modul kunci, dan aturan privasi chat.",
    icon: BookOpen,
    note: "Wajib dibaca onboarding developer baru.",
  },
];

export default function DeveloperQcPage() {
  const visibleRooms = filterRoomsForRole(mockRooms, "developer");
  const lockedRooms = mockRooms.filter((r) => isPrivateMentorRoom(r));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Quality Control Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Developer dapat membuka semua panel pengguna untuk QA visual dan alur, tanpa akses ke
          cabang privat mentor atau chat kolaborasi staf.
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

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-sm font-semibold">Komunitas — ruang yang boleh ditinjau</h2>
          <Button size="sm" variant="outline" render={<Link href="/komunitas" />}>
            <MessageSquare className="size-3.5" />
            Buka komunitas
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {visibleRooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/komunitas/${room.slug}`}
                className="surface-card block p-4 text-sm hover:bg-muted/40"
              >
                <span className="font-medium">{room.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{room.channelCategory}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card space-y-3 border-amber-500/20 p-5">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-amber-600 dark:text-amber-400">
          <Lock className="size-4" />
          Ruang privat mentor (terkunci untuk developer)
        </h2>
        <p className="text-xs text-muted-foreground">
          Room Internal / protected tidak boleh dibuka oleh role developer. Daftar di bawah hanya
          metadata untuk awareness QC — tidak ada tautan ke isi chat.
        </p>
        <ul className="space-y-2">
          {lockedRooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{room.name}</span>
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400"
              >
                <Lock className="size-3" />
                Privat
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
