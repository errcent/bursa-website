"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { getDemoCredentials } from "@/lib/auth/client";
import { buildLoginHref, resolvePostAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";

export function LoginForm() {
  const { login, session, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = resolvePostAuthRedirect(searchParams.get("next"));
  const registerHref =
    next === POST_AUTH_HOME ? "/daftar" : `/daftar?next=${encodeURIComponent(next)}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(next);
    }
  }, [isLoading, session, router, next]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email wajib diisi.";
    if (!password) errors.password = "Kata sandi wajib diisi.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = login({ email, password });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    router.replace(next);
  }

  function fillDemo() {
    const demo = getDemoCredentials();
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setFieldErrors({});
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <AuthField
        label="Email"
        id="email"
        error={fieldErrors.email}
        helperText="Gunakan email yang kamu pakai saat mendaftar."
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          placeholder="nama@email.com"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.email)}
        />
      </AuthField>

      <AuthField
        label="Kata sandi"
        id="password"
        error={fieldErrors.password}
        helperText="Gunakan kata sandi akun yang sudah terdaftar."
      >
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

      <div className="rounded-xl border border-border/60 bg-accent-soft/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Mode demo (prototype)</p>
        <p className="mt-1">
          Learner: <span className="font-mono">demo@bursa.id</span> /{" "}
          <span className="font-mono">demo1234</span>
        </p>
        <p className="mt-1">
          Role: <span className="font-mono">admin@test.dev</span>,{" "}
          <span className="font-mono">mentor@test.dev</span>,{" "}
          <span className="font-mono">developer@test.dev</span> — password{" "}
          <span className="font-mono">password123</span>
        </p>
        <button
          type="button"
          onClick={fillDemo}
          className="mt-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Isi otomatis (learner)
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href={registerHref} className="link-accent text-sm font-medium">
          Daftar gratis
        </Link>
      </p>
    </form>
  );
}
