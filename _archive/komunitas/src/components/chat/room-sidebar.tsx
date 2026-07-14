"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Lock, Megaphone, Users } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ChatUserAvatar } from "@/components/chat/chat-user-avatar";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/instrument-badge";
import { cn } from "@/lib/utils";
import { canViewRoomContents, filterRoomsForRole, isPrivateMentorRoom } from "@/lib/chat/access";
import { safeRoomCount } from "@/lib/chat/room-counts";
import type { ChannelCategory, ChatRoom } from "@/lib/chat/types";

const categoryOrder: ChannelCategory[] = ["Publik", "Komunitas", "Trading", "Internal"];

const categoryLabels: Record<ChannelCategory, string> = {
  Publik: "Publik",
  Internal: "Internal",
  Komunitas: "Grup mentor",
  Trading: "Trading",
};

const categoryDescriptions: Record<ChannelCategory, string> = {
  Publik: "Terbuka untuk semua",
  Internal: "Privat mentor",
  Komunitas: "Cabang 1/2 arah",
  Trading: "Desk trading aktif",
};

interface RoomSidebarProps {
  rooms: ChatRoom[];
  className?: string;
  /** Mentor profile id — used to hide other mentors' hubs */
  mentorProfileId?: string | null;
  /** Hub room ids the mentor may manage (owned or moderated) */
  accessibleHubIds?: string[];
  /** Hub room ids the learner has subscribed to */
  subscribedHubIds?: string[];
}

export function RoomSidebar({
  rooms,
  className,
  mentorProfileId,
  accessibleHubIds,
  subscribedHubIds,
}: RoomSidebarProps) {
  const pathname = usePathname();
  const { session } = useAuth();

  const visibleRooms = filterRoomsForRole(rooms, session?.role, {
    mentorProfileId,
    accessibleHubIds,
    subscribedHubIds,
  });

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      rooms: visibleRooms.filter((r) => r.channelCategory === cat),
    }))
    .filter((g) => g.rooms.length > 0);

  return (
    <aside className={cn("flex flex-col gap-4", className)}>
      {grouped.map(({ category, rooms: catRooms }) => (
        <section key={category}>
          <h3 className="mb-1 px-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {categoryLabels[category]}
          </h3>
          <p className="mb-2 px-2 text-[9px] text-muted-foreground/80">
            {categoryDescriptions[category]}
          </p>
          <ul className="flex flex-col gap-0.5">
            {catRooms.map((room) => {
              const href = room.mentorId
                ? `/komunitas/${room.slug}?mentorId=${encodeURIComponent(room.mentorId)}`
                : `/komunitas/${room.slug}`;
              const active = pathname === `/komunitas/${room.slug}`;
              const locked = !canViewRoomContents(session?.role, room);
              const privateRoom = isPrivateMentorRoom(room);

              const inner = (
                <>
                  <ChatUserAvatar
                    userId={room.mentorId}
                    name={room.mentorName}
                    initials={room.mentorInitials}
                    avatarUrl={room.mentorAvatarUrl}
                    size="sm"
                    className="mt-0.5"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate font-heading text-sm font-medium">{room.name}</span>
                      {(room.isProtected || locked) && (
                        <Lock className="size-3 shrink-0 text-amber-500" />
                      )}
                      {room.channelType === "announcement" && (
                        <Megaphone className="size-3 shrink-0 text-muted-foreground" />
                      )}
                      {room.slowModeSeconds && room.slowModeSeconds > 0 && (
                        <Clock className="size-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {locked ? (
                        <span>Privat — terkunci</span>
                      ) : (
                        <>
                          {room.tier && (
                            <LevelBadge level={room.tier} className="h-4 px-1 text-[9px]" />
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            {safeRoomCount(room.onlineCount)}
                          </span>
                          <span className="truncate">{room.mentorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-0.5 flex shrink-0 flex-col items-end gap-1">
                    {!locked &&
                      (room.hasMention === true ||
                        safeRoomCount(room.mentionUnreadCount) > 0) && (
                        <Badge
                          variant="outline"
                          className="size-5 justify-center rounded-full border-amber-500/40 bg-amber-500/15 p-0 text-[11px] font-bold text-amber-400"
                          title="Ada mention untuk Anda"
                          aria-label="Ada mention belum dibaca"
                        >
                          @
                        </Badge>
                      )}
                    {!locked && safeRoomCount(room.unreadCount) > 0 && (
                      <Badge
                        variant="accent"
                        className="size-5 justify-center rounded-full p-0 text-[10px]"
                        title="Pesan baru"
                        aria-label={`${safeRoomCount(room.unreadCount)} pesan baru`}
                      >
                        {safeRoomCount(room.unreadCount) > 99
                          ? "99+"
                          : String(safeRoomCount(room.unreadCount))}
                      </Badge>
                    )}
                  </div>
                </>
              );

              return (
                <li key={room.id}>
                  {locked ? (
                    <div
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 opacity-60"
                      title={
                        privateRoom
                          ? "Developer tidak dapat membuka private mentor group chat"
                          : "Akses ditolak"
                      }
                      aria-disabled
                    >
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={href}
                      className={cn(
                        "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                        active ? "bg-accent/15 text-foreground" : "hover:bg-muted/50"
                      )}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}
