"use client";

import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { ChatRoomView } from "@/components/chat/chat-room";
import { RoomSidebar } from "@/components/chat/room-sidebar";
import { useMentorRoomScope } from "@/components/chat/use-mentor-room-scope";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { canViewRoomContents, isPublicCommunityRoom } from "@/lib/chat/access";
import type { ChatRoom } from "@/lib/chat/types";
import { mockRooms } from "@/lib/chat/mock-chat-data";

export function ChatRoomPageClient({
  room,
  sidebarRooms,
}: {
  room: ChatRoom;
  sidebarRooms?: ChatRoom[];
}) {
  const { session, isLoading } = useAuth();
  const {
    mentorProfileId,
    accessibleHubIds,
    subscribedHubIds,
    viewerRooms,
    ready: scopeReady,
    refreshRooms,
  } = useMentorRoomScope();
  const roleAllowed = canViewRoomContents(session?.role, room);
  const needsScope = session?.role === "mentor" || session?.role === "learner";
  const roomsForSidebar =
    needsScope && viewerRooms
      ? viewerRooms
      : sidebarRooms?.length
        ? sidebarRooms
        : mockRooms;

  const mentorDenied =
    session?.role === "mentor" &&
    scopeReady &&
    !isPublicCommunityRoom(room) &&
    room.roomKind !== "mentor_internal" &&
    room.channelCategory !== "Internal" &&
    !(mentorProfileId && room.mentorId === mentorProfileId) &&
    !accessibleHubIds.includes(room.id);

  const learnerDenied =
    session?.role === "learner" &&
    scopeReady &&
    !isPublicCommunityRoom(room) &&
    room.roomKind === "mentor_community" &&
    !subscribedHubIds.includes(room.id);

  const allowed = roleAllowed && !mentorDenied && !learnerDenied;

  const denialTitle = mentorDenied
    ? "Akses hub ditolak"
    : learnerDenied
      ? "Belum berlangganan hub"
      : "Ruang privat mentor";

  const denialBody = mentorDenied
    ? "Anda tidak dapat membuka hub milik mentor lain. Hanya hub Anda sendiri (atau hub tempat Anda menjadi moderator) yang dapat diakses."
    : learnerDenied
      ? "Hub mentor hanya terlihat setelah Anda berlangganan (anggota ruang). Enroll kelas mentor tersebut, lalu hub akan muncul di daftar komunitas Anda."
      : "Isi private mentor group chat tidak tersedia untuk role developer. Ini aturan privasi yang disengaja untuk quality control tanpa mengintervensi percakapan internal.";

  const showChat =
    !isLoading && !(needsScope && !scopeReady) && allowed;

  return (
    <AuthGuard>
      {/* Active chat locks to the viewport so only the message list scrolls */}
      <div
        className={
          showChat
            ? "flex h-dvh flex-col overflow-hidden"
            : "flex min-h-dvh flex-col"
        }
      >
        <SiteNavbar />
        <main className="flex min-h-0 flex-1 flex-col">
          {isLoading || (needsScope && !scopeReady) ? (
            <div className="flex flex-1 items-center justify-center py-24">
              <p className="text-sm text-muted-foreground">Memuat ruang...</p>
            </div>
          ) : !allowed ? (
            <div className="container-page flex flex-1 flex-col items-center justify-center py-16 text-center">
              <div className="surface-card max-w-md space-y-4 p-8">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                  <Lock className="size-5" />
                </div>
                <h1 className="font-heading text-xl font-semibold">{denialTitle}</h1>
                <p className="text-sm text-muted-foreground">{denialBody}</p>
                <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="size-3.5" />
                  {room.name}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" render={<Link href="/komunitas" />}>
                    <ArrowLeft className="size-3.5" />
                    Kembali ke komunitas
                  </Button>
                  {session?.role === "developer" ? (
                    <Button size="sm" render={<Link href="/developer" />}>
                      QC Hub
                    </Button>
                  ) : session?.role === "mentor" ? (
                    <Button size="sm" render={<Link href="/mentor/chat" />}>
                      Panel mentor
                    </Button>
                  ) : learnerDenied ? (
                    <Button size="sm" render={<Link href="/kelas" />}>
                      Lihat kelas
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="container-page flex min-h-0 flex-1 flex-col py-3 lg:flex-row lg:gap-6 lg:py-4">
              <aside className="hidden min-h-0 w-64 shrink-0 lg:flex lg:flex-col">
                <div className="surface-card flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
                  <h2 className="mb-4 font-heading text-sm font-semibold">Ruang Chat</h2>
                  <RoomSidebar
                    rooms={roomsForSidebar}
                    mentorProfileId={mentorProfileId}
                    accessibleHubIds={accessibleHubIds}
                    subscribedHubIds={subscribedHubIds}
                  />
                </div>
              </aside>

              <div className="surface-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <ChatRoomView
                  room={room}
                  className="h-full min-h-0"
                  onMarkedRead={() => {
                    void refreshRooms();
                  }}
                />
              </div>
            </div>
          )}
        </main>
        {!showChat && <SiteFooter />}
      </div>
    </AuthGuard>
  );
}
