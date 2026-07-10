"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { PasswordRequirements, PasswordStrengthMeter } from "@/components/password-strength-meter";
import { Button } from "@/components/ui/button";
import { syncLocalPasswordAfterReset } from "@/lib/auth/client";
import { validatePassword } from "@/lib/auth/password-policy";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const policy = useMemo(() => validatePassword(password), [password]);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setTokenValid(false);
      setError("Tautan reset tidak lengkap. Minta tautan baru.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as { valid?: boolean; error?: string };
        if (cancelled) return;
        if (res.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.error ?? "Tautan reset tidak valid.");
        }
      } catch {
        if (!cancelled) {
          setTokenValid(false);
          setError("Gagal memverifikasi tautan. Coba lagi.");
        }
      } finally {
        if (!cancelled) setIsValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: { password?: string; confirm?: string } = {};
    if (!policy.valid) {
      errors.password = policy.errors[0];
    }
    if (password !== confirm) {
      errors.confirm = "Konfirmasi kata sandi tidak cocok.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string; email?: string };

      if (!res.ok) {
        setError(data.error ?? "Gagal memperbarui kata sandi.");
        return;
      }

      if (data.email) {
        syncLocalPasswordAfterReset(data.email, password);
      }

      router.push("/lupa-password/berhasil");
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidating) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Memverifikasi tautan reset...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? "Tautan reset tidak valid."}
        </div>
        <Link href="/lupa-password" className="link-accent text-sm font-medium">
          Minta tautan reset baru
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-accent/30 bg-accent-soft/40">
          <CheckCircle2 className="size-5 text-accent" aria-hidden />
        </div>
      </div>

      <AuthField
        label="Kata sandi baru"
        id="new-password"
        error={fieldErrors.password}
        helperText="Minimal 8 karakter dengan huruf besar, huruf kecil, dan angka."
      >
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          placeholder="Kata sandi baru"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </AuthField>

      {password.length > 0 && (
        <>
          <PasswordStrengthMeter strength={policy.strength} score={policy.score} />
          <PasswordRequirements errors={policy.errors} />
        </>
      )}

      <AuthField
        label="Konfirmasi kata sandi"
        id="confirm-password"
        error={fieldErrors.confirm}
      >
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (fieldErrors.confirm) {
              setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
            }
          }}
          placeholder="Ulangi kata sandi baru"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.confirm)}
        />
      </AuthField>

      <Button type="submit" className="h-11 w-full btn-primary" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Menyimpan kata sandi...
          </>
        ) : (
          "Simpan Kata Sandi Baru"
        )}
      </Button>
    </form>
  );
}
