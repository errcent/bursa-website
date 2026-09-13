"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_THRESHOLD = 88;

type DetailAboutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function DetailAboutSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  className,
}: DetailAboutSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const spring = prefersReducedMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, damping: 34, stiffness: 420, mass: 0.85 };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Tutup panel"
            className="fixed inset-0 z-[85] bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-about-title"
            className={cn(
              "fixed inset-x-0 bottom-0 z-[86] flex max-h-[min(88dvh,640px)] flex-col rounded-t-2xl border border-border/60 bg-background shadow-[0_-24px_80px_rgba(0,0,0,0.45)]",
              className
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            drag={prefersReducedMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.38 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > DISMISS_THRESHOLD || info.velocity.y > 720) {
                close();
              }
            }}
          >
            <div className="flex shrink-0 flex-col items-center pt-2">
              <div className="mb-3 h-1 w-10 rounded-full bg-muted-foreground/35" aria-hidden />
              <div className="flex w-full items-start justify-between gap-3 px-5 pb-2">
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 id="detail-about-title" className="font-heading text-base font-semibold text-foreground">
                    {title}
                  </h2>
                  {subtitle ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-full"
                  aria-label="Tutup"
                  onClick={close}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-1">
              <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function DetailAboutInfoButton({
  onClick,
  className,
  label = "Tentang",
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/18 sm:h-12 sm:w-12",
        className
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-7 items-center justify-center rounded-full border border-white/30 bg-black/20 text-xs font-semibold leading-none text-white sm:size-8 sm:text-[0.8125rem]"
      >
        i
      </span>
    </button>
  );
}
