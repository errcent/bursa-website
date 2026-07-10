"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { loginWithOAuth } from "@/lib/auth/client";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton({ mode }: { mode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const next = resolvePostAuthRedirect(searchParams.get("next"));
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/oauth-status")
      .then((res) => res.json())
      .then((data: { google?: boolean }) => {
        if (!cancelled) setConfigured(Boolean(data.google));
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGoogleSignIn() {
    setError(null);
    setIsLoading(true);
    const callbackPath = mode === "register" ? "/daftar" : "/masuk";
    const callbackUrl = `${callbackPath}?oauth=sync&next=${encodeURIComponent(next)}`;
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Gagal memulai login Google. Coba lagi.");
      setIsLoading(false);
    }
  }

  if (configured === null) {
    return (
      <div className="flex h-11 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Memeriksa login Google...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Login Google (prototype)</p>
        <p className="mt-1">
          Tambahkan <span className="font-mono">GOOGLE_CLIENT_ID</span>,{" "}
          <span className="font-mono">GOOGLE_CLIENT_SECRET</span>, dan{" "}
          <span className="font-mono">NEXTAUTH_SECRET</span> di <span className="font-mono">.env</span>{" "}
          — lihat README.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 border-border/80 bg-background font-medium"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Mengalihkan ke Google...
          </>
        ) : (
          <>
            <GoogleIcon className="size-5" />
            Lanjutkan dengan Google
          </>
        )}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Kami hanya meminta email dan profil publik Google. Data diproses sesuai{" "}
        <Link href="/kebijakan-privasi" className="font-medium underline-offset-4 hover:underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    </div>
  );
}

/** After Google OAuth redirect, sync NextAuth session into localStorage auth. */
export function OAuthSessionSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const syncing = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("oauth") !== "sync" || syncing.current) return;
    syncing.current = true;

    const next = resolvePostAuthRedirect(searchParams.get("next"));

    fetch("/api/auth/oauth-bridge")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Sesi Google tidak valid.");
        }
        return res.json() as Promise<{
          user: {
            id: string;
            email: string;
            name: string;
            avatarUrl?: string | null;
            role?: string;
          };
        }>;
      })
      .then((data) => {
        const result = loginWithOAuth({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatarUrl: data.user.avatarUrl,
          role: data.user.role,
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
        router.replace(next);
      })
      .catch((err: Error) => {
        setError(err.message || "Gagal menyinkronkan sesi Google.");
        syncing.current = false;
      });
  }, [searchParams, router]);

  if (!searchParams.get("oauth")) return null;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Menyelesaikan login Google...
    </div>
  );
}
