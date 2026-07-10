"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ProtectionWarningProps {
  open: boolean;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function ProtectionWarning({
  open,
  onDismiss,
  autoDismissMs = 5000,
}: ProtectionWarningProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [open, autoDismissMs, onDismiss]);

  if (!open && !visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
      role="alertdialog"
      aria-labelledby="protection-warning-title"
      aria-describedby="protection-warning-desc"
    >
      <div
        className={cn(
          "relative w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-6 shadow-2xl transition-transform duration-300",
          visible ? "scale-100" : "scale-95"
        )}
      >
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Tutup peringatan"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
            <ShieldAlert className="size-7 text-destructive" />
          </div>

          <div className="flex flex-col gap-2">
            <h3
              id="protection-warning-title"
              className="font-heading text-lg font-medium text-foreground"
            >
              Konten Dilindungi
            </h3>
            <p id="protection-warning-desc" className="text-sm text-muted-foreground">
              Tangkapan layar atau rekaman terdeteksi. Akses Anda ke konten ini dilindungi dan
              tindakan ini telah dicatat untuk keamanan.
            </p>
          </div>

          <p className="text-xs text-muted-foreground/80">
            Peringatan akan tertutup otomatis dalam beberapa detik.
          </p>
        </div>
      </div>
    </div>
  );
}
