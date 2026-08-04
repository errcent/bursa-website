"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Loader2, MailCheck, MailWarning } from "lucide-react";

import { captureAnalyticsEvent } from "@/lib/analytics/posthog";
import { authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import {
  isTurnstileClientConfigured,
  TurnstileWidget,
} from "@/components/turnstile-widget";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistFormProps {
  source?: string;
}

interface WaitlistOutcome {
  duplicate: boolean;
  verificationRequired: boolean;
  verificationEmailSent: boolean;
}

export function WaitlistForm({ source = "waitlist-page" }: WaitlistFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<WaitlistOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const utm = useMemo(
    () => ({
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      utmContent: searchParams.get("utm_content") ?? undefined,
    }),
    [searchParams]
  );

  const turnstileRequired = isTurnstileClientConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (!consent) {
      setError("Setujui kebijakan privasi untuk melanjutkan.");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          consentGiven: true,
          source,
          ...utm,
          turnstileToken: turnstileToken ?? undefined,
          website: honeypot,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        duplicate?: boolean;
        verificationRequired?: boolean;
        verificationEmailSent?: boolean;
      };

      if (!response.ok) {
        setError(payload.error ?? "Gagal mendaftar. Coba lagi sebentar.");
        return;
      }

      captureAnalyticsEvent("waitlist_signup", {
        source,
        utm_source: utm.utmSource ?? null,
        utm_medium: utm.utmMedium ?? null,
        utm_campaign: utm.utmCampaign ?? null,
        duplicate: payload.duplicate ?? false,
      });

      setOutcome({
        duplicate: Boolean(payload.duplicate),
        verificationRequired: Boolean(payload.verificationRequired),
        verificationEmailSent: Boolean(payload.verificationEmailSent),
      });
    } catch {
      setError("Koneksi bermasalah. Periksa internet kamu lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (outcome) {
    const submittedEmail = email.trim();

    if (outcome.verificationRequired && outcome.verificationEmailSent) {
      return (
        <div className="surface-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center sm:p-8">
          <MailCheck className="size-10 text-emerald" strokeWidth={1.5} />
          <h2 className="font-heading text-lg font-semibold">
            {outcome.duplicate ? "Email verifikasi dikirim ulang" : "Cek inbox kamu"}
          </h2>
          <p className="section-copy max-w-sm">
            Kami mengirim tautan verifikasi ke{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>. Klik tautan itu
            untuk mengonfirmasi pendaftaran waitlist — berlaku 48 jam.
          </p>
          <p className="text-xs text-muted-foreground">
            Tidak ada di inbox? Periksa folder spam atau promosi.
          </p>
        </div>
      );
    }

    if (outcome.verificationRequired) {
      return (
        <div className="surface-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center sm:p-8">
          <MailWarning className="size-10 text-amber-500" strokeWidth={1.5} />
          <h2 className="font-heading text-lg font-semibold">Pendaftaran tersimpan</h2>
          <p className="section-copy max-w-sm">
            <span className="font-medium text-foreground">{submittedEmail}</span> sudah kami catat,
            tapi email verifikasi gagal terkirim. Coba daftar lagi beberapa saat lagi untuk
            mengirim ulang tautannya.
          </p>
        </div>
      );
    }

    return (
      <div className="surface-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center sm:p-8">
        <CheckCircle2 className="size-10 text-emerald" strokeWidth={1.5} />
        <h2 className="font-heading text-lg font-semibold">
          {outcome.duplicate ? "Kamu sudah di waitlist" : "Berhasil gabung waitlist"}
        </h2>
        <p className="section-copy max-w-sm">
          {outcome.duplicate ? (
            <>
              <span className="font-medium text-foreground">{submittedEmail}</span> sudah terdaftar.
              Kami akan mengabari kamu begitu Bursa dibuka.
            </>
          ) : (
            <>
              Terima kasih — <span className="font-medium text-foreground">{submittedEmail}</span>{" "}
              sudah masuk waitlist. Kami akan mengabari kamu begitu platform edukasi trading Bursa
              siap dibuka.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="waitlist-email" className="sr-only">
            Alamat email
          </label>
          <input
            id="waitlist-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="nama@email.com"
            className={authInputClassName}
            aria-invalid={Boolean(error)}
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          variant="inverse"
          className="h-12 shrink-0 rounded-xl px-6"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUpRight className="size-4" />
          )}
          Gabung Waitlist
        </Button>
      </div>

      <label className="flex items-start gap-2 text-left text-xs text-muted-foreground sm:text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (error) setError(null);
          }}
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
          disabled={loading}
        />
        <span>
          Saya setuju menerima email update dari Bursa dan telah membaca{" "}
          <Link href="/privasi" className="link-muted font-medium text-foreground">
            Kebijakan Privasi
          </Link>
          .
        </span>
      </label>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <TurnstileWidget onToken={setTurnstileToken} className="flex justify-center sm:justify-start" />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
