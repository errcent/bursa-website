import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { verifyWebSessionToken, WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

export async function requireServerSession(allowedRoles: UserRole[], nextPath: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) {
    redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  }

  const session = await verifyWebSessionToken(token);
  if (!session) {
    redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || !allowedRoles.includes(user.role)) {
    redirect("/404");
  }

  return session;
}
