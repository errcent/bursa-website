"use client";

import { FileText, Image as ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageAttachment, PendingAttachment } from "@/lib/chat/types";

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  className?: string;
}

export function AttachmentDisplay({ attachment, className }: AttachmentPreviewProps) {
  if (attachment.type === "image") {
    return (
      <div className={cn("mt-2 max-w-xs overflow-hidden rounded-lg border border-border/60", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-48 w-full object-cover"
        />
      </div>
    );
  }

  const Icon = attachment.type === "pdf" ? FileText : ImageIcon;

  return (
    <div
      className={cn(
        "mt-2 flex max-w-xs items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="size-5 text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        {attachment.size && (
          <p className="text-[10px] text-muted-foreground">
            {formatFileSize(attachment.size)}
          </p>
        )}
      </div>
    </div>
  );
}

interface PendingAttachmentsBarProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  className?: string;
}

export function PendingAttachmentsBar({
  attachments,
  onRemove,
  className,
}: PendingAttachmentsBarProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("mb-2 flex flex-wrap gap-2", className)}>
      {attachments.map((att) => (
        <div
          key={att.id}
          className="relative flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5"
        >
          {att.type === "image" && att.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={att.previewUrl}
              alt={att.file.name}
              className="size-10 rounded object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded bg-accent/10">
              <FileText className="size-4 text-accent" />
            </div>
          )}
          <div className="min-w-0 max-w-[120px]">
            <p className="truncate text-xs font-medium">{att.file.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatFileSize(att.file.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={() => onRemove(att.id)}
            aria-label="Hapus lampiran"
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
