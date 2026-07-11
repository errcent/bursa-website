"use client";

import Link from "next/link";
import { ClipboardList, Lock, MessageSquare, Settings, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { canMutateMentor } from "@/lib/auth/roles";
import { mockRooms } from "@/lib/chat/mock-chat-data";

export default function MentorDashboardPage() {
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);
  const myRooms = mockRooms.filter((r) => r.channelCategory === "Internal" || r.isProtected);
  const publicRooms = mockRooms.filter((r) => r.channelCategory !== "Internal" && !r.isProtected);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ringkasan Mentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajukan usulan perubahan konten kelas, kolaborasi dengan admin, dan kelola profil.
          {readOnly && " Anda sedang meninjau sebagai developer (QC)."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground">Ruang internal</p>
          <p className="mt-1 font-heading text-2xl font-semibold">{myRooms.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground">Ruang publik terkait</p>
          <p className="mt-1 font-heading text-2xl font-semibold">{publicRooms.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground">Status profil</p>
          <p className="mt-1 font-heading text-lg font-semibold text-emerald">Aktif</p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/mentor/usulan" />}
        >
          <ClipboardList className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Usulan Konten</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Ajukan perubahan kurikulum
            </span>
          </span>
        </Button>
        <Button className="h-auto flex-col items-start gap-2 p-4" variant="outline" render={<Link href="/mentor/chat" />}>
          <MessageSquare className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Group Chat</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Kolaborasi admin & domain
            </span>
          </span>
        </Button>
        <Button className="h-auto flex-col items-start gap-2 p-4" variant="outline" render={<Link href="/mentor/profil" />}>
          <UserRound className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Identitas</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Profil & branding mentor
            </span>
          </span>
        </Button>
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/mentor/pengaturan" />}
        >
          <Settings className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Pengaturan</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Preferensi panel mentor
            </span>
          </span>
        </Button>
      </section>

      <section className="surface-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold">
          <Lock className="size-4 text-amber-500" />
          Alur konten & privasi
        </h2>
        <p className="text-sm text-muted-foreground">
          Perubahan konten kelas hanya diterapkan setelah admin menyetujui usulan Anda. Chat{" "}
          <strong className="text-foreground">privat dengan admin</strong> (satu thread per mentor)
          bersifat privat — developer QC dapat melihat panel ini tetapi tidak membuka isi pesan.
        </p>
      </section>
    </div>
  );
}
