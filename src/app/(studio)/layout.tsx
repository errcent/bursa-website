import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import { isImageStudioEnabled } from "@/lib/image-studio/config";

export default function StudioLayout({ children }: { children: ReactNode }) {
  if (!isImageStudioEnabled()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,147,167,0.08),transparent_55%)]" />
      {children}
    </div>
  );
}
