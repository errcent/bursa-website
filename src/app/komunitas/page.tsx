import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { CommunityHub } from "@/components/chat/community-hub";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { listActiveChatRooms } from "@/lib/chat/db-rooms";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { mockRooms } from "@/lib/chat/mock-chat-data";
import { normalizeChatRoomCounts } from "@/lib/chat/room-counts";

export const metadata: Metadata = {
  title: "Komunitas Trading",
  description:
    "Ruang publik terbuka untuk semua, plus grup mentor dengan cabang 1 arah / 2 arah.",
};

export default async function KomunitasPage() {
  if (!KOMUNITAS_ENABLED) notFound();

  const dbRooms = await listActiveChatRooms().catch(() => []);
  const rooms = (dbRooms.length > 0 ? dbRooms : mockRooms).map((room) =>
    normalizeChatRoomCounts(room)
  );

  return (
    <AuthGuard>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page py-10 sm:py-12">
            <p className="eyebrow mb-2">Komunitas</p>
            <h1 className="page-hero-title text-gradient">Ruang Diskusi Trading</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Ruang publik untuk semua anggota, dan hub mentor yang sudah Anda ikuti setelah enroll
              kelas.
            </p>
          </div>
        </div>

        <div className="container-page section-spacious">
          <CommunityHub rooms={rooms} />
        </div>
      </main>
      <SiteFooter />
    </AuthGuard>
  );
}
