"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Radio,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { ChatUserAvatar } from "@/components/chat/chat-user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ChatMember, ChatRoom, MemberRole } from "@/lib/chat/types";

const roleOptions: { value: MemberRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "moderator", label: "Moderator" },
];

const roleToApi: Record<MemberRole, "MEMBER" | "MODERATOR" | "MENTOR"> = {
  member: "MEMBER",
  moderator: "MODERATOR",
  mentor: "MENTOR",
};

interface GroupSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom;
  members: ChatMember[];
  currentUserId: string;
  onRoomUpdate: (patch: Partial<ChatRoom>) => void;
  onMembersChange: (members: ChatMember[]) => void;
  onMemberClick: (member: ChatMember) => void;
}

export function GroupSettingsSheet({
  open,
  onOpenChange,
  room,
  members,
  currentUserId,
  onRoomUpdate,
  onMembersChange,
  onMemberClick,
}: GroupSettingsSheetProps) {
  const [name, setName] = useState(room.name);
  const [liveTitle, setLiveTitle] = useState(room.liveTitle ?? "Sesi live mentor");
  const [savingName, setSavingName] = useState(false);
  const [liveBusy, setLiveBusy] = useState(false);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(room.name);
      setLiveTitle(room.liveTitle ?? "Sesi live mentor");
      setError(null);
    }
  }, [open, room.name, room.liveTitle]);

  const editableMembers = useMemo(
    () =>
      members.filter((m) => {
        const isHubMentor =
          Boolean(room.mentorSlug) &&
          m.profileSlug === room.mentorSlug;
        return m.role !== "mentor" && !isHubMentor;
      }),
    [members, room.mentorSlug]
  );

  const mentorMembers = useMemo(
    () =>
      members
        .filter(
          (m) =>
            m.role === "mentor" ||
            (Boolean(room.mentorSlug) && m.profileSlug === room.mentorSlug)
        )
        .map((m) => (m.role === "mentor" ? m : { ...m, role: "mentor" as const })),
    [members, room.mentorSlug]
  );

  const persistName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === room.name) return;
    setSavingName(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        onRoomUpdate({ name: trimmed });
      } else {
        // Mock / offline fallback — still update local UI
        onRoomUpdate({ name: trimmed });
      }
    } catch {
      onRoomUpdate({ name: trimmed });
    } finally {
      setSavingName(false);
    }
  };

  const setMemberRole = async (member: ChatMember, role: MemberRole) => {
    if (member.role === role || role === "mentor") return;
    setRoleBusyId(member.id);
    setError(null);
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roleToApi[role],
          requestedByUserId: currentUserId,
        }),
      });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Gagal mengubah peran anggota");
      }
    } catch {
      /* local mock fallback */
    }
    onMembersChange(
      members.map((m) => (m.id === member.id ? { ...m, role } : m))
    );
    setRoleBusyId(null);
  };

  const toggleLive = async () => {
    setLiveBusy(true);
    setError(null);
    const nextLive = !room.isLive;
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLive: nextLive,
          liveTitle: liveTitle.trim() || "Sesi live mentor",
          userId: currentUserId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onRoomUpdate({
          isLive: data.room.isLive,
          liveStartedAt: data.room.liveStartedAt ?? undefined,
          liveTitle: data.room.liveTitle ?? undefined,
        });
      } else {
        onRoomUpdate({
          isLive: nextLive,
          liveStartedAt: nextLive ? new Date().toISOString() : undefined,
          liveTitle: nextLive ? liveTitle.trim() || "Sesi live mentor" : undefined,
        });
      }
    } catch {
      onRoomUpdate({
        isLive: nextLive,
        liveStartedAt: nextLive ? new Date().toISOString() : undefined,
        liveTitle: nextLive ? liveTitle.trim() || "Sesi live mentor" : undefined,
      });
    } finally {
      setLiveBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            Pengaturan Grup
          </SheetTitle>
          <SheetDescription>
            Kelola nama grup, peran anggota, dan sesi live mentor.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <section className="space-y-3">
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Nama grup
            </h3>
            <AuthField label="Nama" id="group-name">
              <input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={authInputClassName}
                maxLength={120}
              />
            </AuthField>
            <Button
              type="button"
              size="sm"
              className="btn-primary"
              disabled={savingName || !name.trim() || name.trim() === room.name}
              onClick={() => void persistName()}
            >
              {savingName ? "Menyimpan…" : "Simpan nama"}
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Radio className="size-3" />
              Live mentor
            </h3>
            {room.isLive ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                  </span>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    Sedang live
                  </p>
                </div>
                {room.liveTitle && (
                  <p className="mt-1 text-xs text-muted-foreground">{room.liveTitle}</p>
                )}
              </div>
            ) : (
              <AuthField label="Judul sesi" id="live-title">
                <input
                  id="live-title"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  className={authInputClassName}
                  placeholder="Contoh: Review setup BBCA"
                  maxLength={160}
                />
              </AuthField>
            )}
            <Button
              type="button"
              size="sm"
              variant={room.isLive ? "destructive" : "accent"}
              disabled={liveBusy}
              onClick={() => void toggleLive()}
            >
              {liveBusy
                ? "Memproses…"
                : room.isLive
                  ? "Akhiri live"
                  : "Mulai live di grup"}
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Users className="size-3" />
              Peran anggota
            </h3>
            <ul className="flex flex-col gap-1">
              {mentorMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      onClick={() => onMemberClick(member)}
                    >
                      <ChatUserAvatar
                        userId={member.id}
                        name={member.name}
                        initials={member.initials}
                        avatarUrl={member.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.name}</p>
                        <Badge
                          variant="outline"
                          className="mt-0.5 h-4 gap-0.5 border-accent/30 bg-accent/10 px-1 text-[9px] text-accent"
                        >
                          <Crown className="size-2.5" />
                          Mentor
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}

              {editableMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/40"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => onMemberClick(member)}
                  >
                    <ChatUserAvatar
                      userId={member.id}
                      name={member.name}
                      initials={member.initials}
                      avatarUrl={member.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        @{member.username ?? member.name.split(" ")[0]?.toLowerCase()}
                      </p>
                    </div>
                  </button>
                  <select
                    aria-label={`Peran ${member.name}`}
                    className={cn(
                      "h-8 shrink-0 rounded-lg border border-border/60 bg-background px-2 text-xs",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    )}
                    value={member.role}
                    disabled={roleBusyId === member.id}
                    onChange={(e) =>
                      void setMemberRole(member, e.target.value as MemberRole)
                    }
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <SheetFooter className="border-t border-border/60">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface MemberProfileSheetProps {
  member: ChatMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberProfileSheet({
  member,
  open,
  onOpenChange,
}: MemberProfileSheetProps) {
  if (!member) return null;

  const RoleIcon =
    member.role === "mentor" ? Crown : member.role === "moderator" ? Shield : User;
  const roleLabel =
    member.role === "mentor"
      ? "Mentor"
      : member.role === "moderator"
        ? "Moderator"
        : "Member";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Profil anggota</SheetTitle>
          <SheetDescription>Detail singkat anggota di grup ini.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center gap-4 px-4 pb-6 pt-2 text-center">
          <ChatUserAvatar
            userId={member.id}
            name={member.name}
            initials={member.initials}
            avatarUrl={member.avatarUrl}
            size="lg"
            className="!size-20"
            fallbackClassName="text-lg"
          />
          <div>
            <h3 className="font-heading text-lg font-semibold">{member.name}</h3>
            {member.username && (
              <p className="text-sm text-muted-foreground">@{member.username}</p>
            )}
            <Badge variant="outline" className="mt-2 gap-1">
              <RoleIcon className="size-3" />
              {roleLabel}
            </Badge>
          </div>
          {member.bio && (
            <p className="text-sm text-muted-foreground">{member.bio}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "size-2 rounded-full",
                member.isOnline ? "bg-emerald" : "bg-muted-foreground/40"
              )}
            />
            {member.isOnline ? "Online" : "Offline"}
          </div>
          {member.profileSlug && (
            <Button
              render={<Link href={`/instruktur/${member.profileSlug}`} />}
              nativeButton={false}
              className="btn-primary w-full"
            >
              Lihat profil publik
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
