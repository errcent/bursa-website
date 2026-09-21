import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import { verifyWebSessionToken, WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { db } from "@/lib/db";
import { isImageStudioEnabled } from "@/lib/image-studio/config";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  if (!isImageStudioEnabled()) {
    notFound();
  }

  // U-002: UI shell is admin-only (APIs also gated via assertImageStudioAdmin).
  const jar = await cookies();
  const token = jar.get(WEB_SESSION_COOKIE)?.value;
  if (!token) notFound();
  const session = await verifyWebSessionToken(token);
  if (!session) notFound();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.ADMIN) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,147,167,0.08),transparent_55%)]" />
      {children}
    </div>
  );
}
