"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { clearLogoutFlag, loginWithOAuth } from "@/lib/auth/client";
import {
  clearOAuthNext,
  readOAuthNext,
} from "@/lib/auth/oauth-redirect";
import { redirectAfterAuth, resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";

type BridgeUser = {
  id: string;
  email: string;
  name: string;
  username?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
};

async function fetchOAuthBridge(attempt = 0): Promise<Response> {
  const res = await fetch("/api/auth/oauth-bridge", { credentials: "include" });
  if (res.status === 401 && attempt < 8) {
    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    return fetchOAuthBridge(attempt + 1);
  }
  return res;
}

function GoogleOAuthCompleteInner() {
  const searchParams = useSearchParams();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    clearLogoutFlag();

    const next = readOAuthNext(searchParams.get("next"));

    void fetchOAuthBridge()
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Sesi Google tidak valid.");
        }
        return res.json() as Promise<{ user: BridgeUser }>;
      })
      .then((data) => {
        const result = loginWithOAuth({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          username: data.user.username,
          phone: data.user.phone,
          bio: data.user.bio,
          avatarUrl: data.user.avatarUrl,
          role: data.user.role,
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
        clearOAuthNext();
        redirectAfterAuth(resolvePostAuthRedirect(next));
      })
      .catch((err: Error) => {
        setError(err.message || "Gagal menyelesaikan login Google.");
        startedRef.current = false;
      });
  }, [searchParams]);

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center">
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
        <Button render={<Link href={`/masuk?next=${encodeURIComponent(readOAuthNext(searchParams.get("next")))}`} />} variant="outline">
          Kembali ke masuk
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Loader2 className="size-7 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">Menyelesaikan login Google…</p>
    </div>
  );
}

export function GoogleOAuthComplete() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="size-7 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Memuat…</p>
        </div>
      }
    >
      <GoogleOAuthCompleteInner />
    </Suspense>
  );
}
