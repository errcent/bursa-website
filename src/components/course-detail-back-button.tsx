"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function CourseDetailBackButton() {
  return (
    <Link
      href="/katalog"
      aria-label="Kembali ke katalog"
      className={cn(
        "fixed z-[60] inline-flex size-11 items-center justify-center rounded-full",
        "bg-black/40 text-white/90 ring-1 ring-white/15 backdrop-blur-sm",
        "transition-colors hover:bg-black/55 hover:text-white",
        "md:hidden",
        "left-[max(0.75rem,env(safe-area-inset-left,0px))]",
        "top-[max(0.5rem,env(safe-area-inset-top,0px))]"
      )}
    >
      <ChevronLeft className="size-5" strokeWidth={2.25} />
    </Link>
  );
}
