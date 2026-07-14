"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColorClasses } from "@/lib/chat/avatar-color";
import { cn } from "@/lib/utils";

interface ChatUserAvatarProps {
  userId?: string | null;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
  fallbackClassName?: string;
}

/** Avatar with photo, or initials on a deterministic per-user color. */
export function ChatUserAvatar({
  userId,
  name,
  initials,
  avatarUrl,
  size = "sm",
  className,
  fallbackClassName,
}: ChatUserAvatarProps) {
  const colorClasses = getAvatarColorClasses(userId, name);

  return (
    <Avatar size={size} className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          "font-medium",
          size === "sm" && "text-[10px]",
          size === "lg" && "text-lg",
          colorClasses,
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
