"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { useAuth } from "@/components/auth-provider";
import { GoogleSignInButton, OAuthSessionSync } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { resolvePostAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";

export function LoginForm() {
  const { login, session, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = resolvePostAuthRedirect(searchParams.get("next"));
  const registerHref =
    next === POST_AUTH_HOME ? "/daftar" : `/daftar?next=${encodeURIComponent(next)}`;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(next);
    }
  }, [isLoading, session, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) errors.identifier = "Username, email, atau nomor telepon wajib diisi.";
    if (!password) errors.password = "Kata sandi wajib diisi.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await login({ identifier, password });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    router.replace(next);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <OAuthSessionSync />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <AuthField
        label="Email, username, atau nomor telepon"
        id="identifier"
        error={fieldErrors.identifier}
        helperText="Masuk dengan email, username (@handle), atau nomor telepon (+62)."
      >
        <input
          id="identifier"
          type="text"
          autoComplete="username"
          inputMode="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (fieldErrors.identifier) {
              setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
            }
          }}
          placeholder="nama@email.com, @username, atau +62812..."
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.identifier)}
        />
      </AuthField>

      <AuthField
        label="Kata sandi"
        id="password"
        error={fieldErrors.password}
        helperText="Gunakan kata sandi akun yang sudah terdaftar."
      >
        <div className="flex flex-col gap-1.5">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            placeholder="Minimal 8 karakter"
            className={authInputClassName}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <div className="flex justify-end">
            <Link href="/lupa-password" className="link-accent text-xs font-medium">
              Lupa kata sandi?
            </Link>
          </div>
        </div>
      </AuthField>

      <Button type="submit" className="h-11 w-full btn-primary" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sedang masuk...
          </>
        ) : (
          "Masuk"
        )}
      </Button>

      <div className="relative flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">atau</span>
        <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
      </div>

      <GoogleSignInButton mode="login" />

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href={registerHref} className="link-accent text-sm font-medium">
          Daftar gratis
        </Link>
      </p>
    </form>
  );
}
