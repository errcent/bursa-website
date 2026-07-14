"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  initScreenshotProtection,
  type ScreenshotAttemptMethod,
} from "@/lib/chat/anti-screenshot";

interface ProtectedContentProps {
  userId: string;
  userName: string;
  roomId: string;
  onScreenshotAttempt?: (method: ScreenshotAttemptMethod) => void;
  children: React.ReactNode;
  className?: string;
}

export function ProtectedContent({
  userId,
  userName,
  roomId,
  onScreenshotAttempt,
  children,
  className,
}: ProtectedContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleAttempt = (method: ScreenshotAttemptMethod) => {
      onScreenshotAttempt?.(method);

      const messages: Record<ScreenshotAttemptMethod, string> = {
        "screen-capture": "Aktivitas capture layar terdeteksi. Tindakan dicatat.",
        visibility: "Tab disembunyikan — konten dilindungi.",
        devtools: "Developer tools terdeteksi. Konten dilindungi.",
        "context-menu": "Menu konteks diblokir di ruang ini.",
      };

      setWarning(messages[method]);
      window.setTimeout(() => setWarning(null), 4000);
    };

    return initScreenshotProtection(el, userId, userName, {
      onScreenshotAttempt: handleAttempt,
    });
  }, [userId, userName, onScreenshotAttempt]);

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <Lock className="size-3" />
          Ruang Dilindungi
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          Konten internal · Anti-screenshot aktif
        </span>
      </div>

      {warning && (
        <div
          role="alert"
          className="absolute inset-x-0 top-10 z-30 mx-auto flex w-fit max-w-sm items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive shadow-lg backdrop-blur-sm"
        >
          <ShieldAlert className="size-4 shrink-0" />
          {warning}
        </div>
      )}

      <div
        ref={containerRef}
        data-room-id={roomId}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
      >
        {children}
      </div>
    </div>
  );
}
