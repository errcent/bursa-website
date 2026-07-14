import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MessageEmbed } from "@/lib/chat/types";

interface MessageEmbedCardProps {
  embed: MessageEmbed;
  className?: string;
}

export function MessageEmbedCard({ embed, className }: MessageEmbedCardProps) {
  let hostname = "";
  try {
    hostname = new URL(embed.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = embed.url;
  }

  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-2 flex max-w-md overflow-hidden rounded-lg border border-border/60 bg-muted/20 transition-colors hover:bg-muted/40",
        className
      )}
    >
      {embed.imageUrl && (
        <div
          className="hidden w-24 shrink-0 bg-cover bg-center sm:block"
          style={{ backgroundImage: `url(${embed.imageUrl})` }}
        />
      )}
      <div
        className="min-w-0 flex-1 border-l-2 p-3"
        style={{ borderColor: embed.color ?? "var(--accent)" }}
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {embed.siteName ?? hostname}
        </p>
        {embed.title && (
          <p className="mt-0.5 line-clamp-2 text-sm font-medium">{embed.title}</p>
        )}
        {embed.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {embed.description}
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1 truncate text-[10px] text-accent">
          <ExternalLink className="size-2.5 shrink-0" />
          {hostname}
        </p>
      </div>
    </a>
  );
}
