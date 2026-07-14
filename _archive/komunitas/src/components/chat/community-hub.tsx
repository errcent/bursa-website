"use client";

import Link from "next/link";
import { Lock, MessageSquare, Users } from "lucide-react";
import { motion } from "motion/react";

import { useAuth } from "@/components/auth-provider";
import { ChatUserAvatar } from "@/components/chat/chat-user-avatar";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/instrument-badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { RoomSidebar } from "@/components/chat/room-sidebar";
import { useMentorRoomScope } from "@/components/chat/use-mentor-room-scope";
import { cn } from "@/lib/utils";
import { filterRoomsForRole, isPrivateMentorRoom } from "@/lib/chat/access";
import { mockRooms } from "@/lib/chat/mock-chat-data";
import {
  normalizeChatRoomCounts,
  safeRoomCount,
} from "@/lib/chat/room-counts";
import { branchModeLabel } from "@/lib/chat/room-kinds";
import type { ChannelCategory, ChatRoom } from "@/lib/chat/types";

const categoryDescriptions: Record<ChannelCategory, string> = {
  Publik: "Terbuka untuk semua anggota platform",
  Internal: "Kolaborasi staf (bukan hub mentor)",
  Komunitas: "Satu grup per mentor — cabang publik & privat di dalamnya",
  Trading: "Desk trading aktif dengan analisis mendalam",
};

function RoomCard({ room, locked }: { room: ChatRoom; locked?: boolean }) {
  const isPublic = room.roomKind === "public";
  const unreadCount = safeRoomCount(room.unreadCount);
  const hasMention =
    room.hasMention === true || safeRoomCount(room.mentionUnreadCount) > 0;
  const onlineCount = safeRoomCount(room.onlineCount);
  const content = (
    <motion.div
      whileHover={locked ? undefined : { y: -4 }}
      className={cn(
        "surface-card-hover flex h-full flex-col gap-3 p-5",
        locked && "pointer-events-none opacity-70",
        isPublic && "ring-1 ring-accent/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {!isPublic && (
            <ChatUserAvatar
              userId={room.mentorId}
              name={room.mentorName}
              initials={room.mentorInitials}
              avatarUrl={room.mentorAvatarUrl}
              size="sm"
            />
          )}
          {isPublic && (
            <Badge variant="accent" className="rounded-full">
              Publik
            </Badge>
          )}
          {room.tier && <LevelBadge level={room.tier} />}
          {(room.isProtected || locked) && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <Lock className="size-3" />
              {locked ? "Terkunci" : "Dilindungi"}
            </Badge>
          )}
        </div>
        {!locked && (hasMention || unreadCount > 0) && (
          <div className="flex shrink-0 items-center gap-1.5">
            {hasMention && (
              <Badge
                variant="outline"
                className="size-6 justify-center rounded-full border-amber-500/40 bg-amber-500/15 p-0 text-xs font-bold text-amber-400"
                title="Ada mention untuk Anda"
                aria-label="Ada mention belum dibaca"
              >
                @
              </Badge>
            )}
            {unreadCount > 0 && (
              <Badge
                variant="accent"
                className="rounded-full"
                title="Pesan baru"
                aria-label={`${unreadCount} pesan baru`}
              >
                {unreadCount > 99 ? "99+" : String(unreadCount)}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-heading text-sm font-semibold">{room.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {locked
            ? "Konten privat mentor — tidak tersedia untuk role developer."
            : room.description}
        </p>
        {!locked && room.branches && room.branches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {room.branches
              .filter((b) => b.visibility !== "private")
              .map((b) => (
              <Badge key={b.id} variant="outline" className="text-[10px]">
                {b.name} · {branchModeLabel(b.mode)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3" />
          {locked ? "—" : `${onlineCount} online`}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3" />
          {isPublic ? "Semua anggota" : room.mentorName}
        </span>
      </div>
    </motion.div>
  );

  if (locked) {
    return <div className="block h-full">{content}</div>;
  }

  return (
    <Link
      href={
        room.mentorId
          ? `/komunitas/${room.slug}?mentorId=${encodeURIComponent(room.mentorId)}`
          : `/komunitas/${room.slug}`
      }
      className="block h-full"
    >
      {content}
    </Link>
  );
}

interface CommunityHubProps {
  rooms?: ChatRoom[];
  className?: string;
}

export function CommunityHub({ rooms: roomsProp, className }: CommunityHubProps) {
  const { session } = useAuth();
  const {
    mentorProfileId,
    accessibleHubIds,
    subscribedHubIds,
    viewerRooms,
    ready: scopeReady,
  } = useMentorRoomScope();
  const isDeveloper = session?.role === "developer";
  const needsScope = session?.role === "mentor" || session?.role === "learner";
  // Prefer API-scoped list for learners/mentors so unsubscribed hubs never appear in props.
  const rawSourceRooms =
    needsScope && viewerRooms
      ? viewerRooms
      : roomsProp?.length
        ? roomsProp
        : mockRooms;
  const sourceRooms = rawSourceRooms.map((room) => normalizeChatRoomCounts(room));
  const scopeOpts =
    session?.role === "mentor"
      ? { mentorProfileId, accessibleHubIds }
      : session?.role === "learner"
        ? { subscribedHubIds }
        : undefined;
  const accessibleRooms =
    needsScope && viewerRooms
      ? sourceRooms
      : filterRoomsForRole(sourceRooms, session?.role, scopeOpts);
  const lockedPrivateRooms = isDeveloper
    ? sourceRooms.filter((r) => isPrivateMentorRoom(r))
    : [];

  const totalOnline = accessibleRooms.reduce(
    (sum, r) => sum + safeRoomCount(r.onlineCount),
    0
  );
  const totalUnread = accessibleRooms.reduce(
    (sum, r) => sum + safeRoomCount(r.unreadCount),
    0
  );

  const categories: ChannelCategory[] = ["Publik", "Komunitas", "Trading"];

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row lg:gap-10", className)}>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="surface-card sticky top-20 p-4">
          <h2 className="mb-4 font-heading text-sm font-semibold">Ruang Chat</h2>
          {!scopeReady && needsScope ? (
            <p className="px-2 text-xs text-muted-foreground">Memuat ruang...</p>
          ) : (
            <RoomSidebar
              rooms={sourceRooms}
              mentorProfileId={mentorProfileId}
              accessibleHubIds={accessibleHubIds}
              subscribedHubIds={subscribedHubIds}
            />
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <Reveal className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-1">Komunitas Trading</p>
              <h2 className="section-title">Ruang Diskusi Bursa</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ruang publik platform, plus hub mentor yang sudah Anda ikuti (setelah enroll kelas).
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="surface-card px-4 py-2 text-center">
                <p className="font-mono text-lg font-semibold">{String(totalOnline)}</p>
                <p className="text-[11px] text-muted-foreground">Online</p>
              </div>
              <div className="surface-card px-4 py-2 text-center">
                <p className="font-mono text-lg font-semibold text-accent">
                  {String(totalUnread)}
                </p>
                <p className="text-[11px] text-muted-foreground">Belum dibaca</p>
              </div>
            </div>
          </div>
        </Reveal>

        {isDeveloper && lockedPrivateRooms.length > 0 && (
          <section className="mb-10">
            <Reveal className="mb-4">
              <h3 className="font-heading text-base font-medium">Kolaborasi staf (terkunci)</h3>
              <p className="text-xs text-muted-foreground">
                Developer QC tidak dapat membuka chat privat staf. Cabang privat di hub mentor juga disembunyikan.
              </p>
            </Reveal>
            <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {lockedPrivateRooms.map((room) => (
                <StaggerItem key={room.id}>
                  <RoomCard room={room} locked />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        )}

        {categories.map((cat) => {
          const rooms = accessibleRooms.filter((r) => r.channelCategory === cat);
          if (rooms.length === 0) return null;

          return (
            <section key={cat} className="mb-10">
              <Reveal className="mb-4">
                <h3 className="font-heading text-base font-medium">{cat}</h3>
                <p className="text-xs text-muted-foreground">{categoryDescriptions[cat]}</p>
              </Reveal>
              <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => (
                  <StaggerItem key={room.id}>
                    <RoomCard room={room} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          );
        })}
      </div>
    </div>
  );
}
