"use client";

import { Crown, Shield, User } from "lucide-react";

import { ChatUserAvatar } from "@/components/chat/chat-user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatMember, MemberRole } from "@/lib/chat/types";

const roleConfig: Record<
  MemberRole,
  { label: string; icon: typeof Crown; className: string; order: number }
> = {
  mentor: {
    label: "Mentor",
    icon: Crown,
    className: "border-accent/30 bg-accent/10 text-accent",
    order: 0,
  },
  moderator: {
    label: "Moderator",
    icon: Shield,
    className: "border-emerald/30 bg-emerald/10 text-emerald",
    order: 1,
  },
  member: {
    label: "Member",
    icon: User,
    className: "",
    order: 2,
  },
};

interface MemberListProps {
  members: ChatMember[];
  className?: string;
  /** When set, members whose profileSlug matches are treated as mentors. */
  mentorSlug?: string;
  onMemberClick?: (member: ChatMember) => void;
}

function resolveDisplayRole(
  member: ChatMember,
  mentorSlug?: string
): MemberRole {
  if (
    mentorSlug &&
    member.profileSlug &&
    member.profileSlug === mentorSlug
  ) {
    return "mentor";
  }
  return member.role;
}

export function MemberList({
  members,
  className,
  mentorSlug,
  onMemberClick,
}: MemberListProps) {
  const roles: MemberRole[] = ["mentor", "moderator", "member"];

  const displayMembers = members.map((m) => {
    const role = resolveDisplayRole(m, mentorSlug);
    return role === m.role ? m : { ...m, role };
  });

  const renderMember = (member: ChatMember) => {
    const config = roleConfig[member.role];
    const RoleIcon = config.icon;
    const showBadge = member.role === "mentor" || member.role === "moderator";

    const content = (
      <>
        <div className="relative">
          <ChatUserAvatar
            userId={member.id}
            name={member.name}
            initials={member.initials}
            avatarUrl={member.avatarUrl}
            size="sm"
          />
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background",
              member.isOnline ? "bg-emerald" : "bg-muted-foreground/40"
            )}
            title={member.isOnline ? "Online" : "Offline"}
          />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{member.name}</p>
          {showBadge && (
            <Badge
              variant="outline"
              className={cn("mt-0.5 h-4 gap-0.5 px-1 text-[9px]", config.className)}
            >
              <RoleIcon className="size-2.5" />
              {config.label}
            </Badge>
          )}
        </div>
      </>
    );

    return (
      <li key={member.id}>
        {onMemberClick ? (
          <button
            type="button"
            onClick={() => onMemberClick(member)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
          >
            {content}
          </button>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">{content}</div>
        )}
      </li>
    );
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {roles.map((role) => {
        const roleMembers = displayMembers.filter((m) => m.role === role);
        if (roleMembers.length === 0) return null;

        const online = roleMembers.filter((m) => m.isOnline);
        const offline = roleMembers.filter((m) => !m.isOnline);
        const config = roleConfig[role];

        return (
          <section key={role}>
            <h3 className="mb-2 px-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {config.label} — {roleMembers.length}
            </h3>
            <ul className="flex flex-col gap-0.5">
              {online.map(renderMember)}
              {offline.map((m) => (
                <div key={m.id} className="opacity-60">
                  {renderMember(m)}
                </div>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
