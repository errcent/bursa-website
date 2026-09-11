"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

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
  confirmationEmailScheduled: boolean;
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
  const [showTurnstile, setShowTurnstile] = useState(false);

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
      setError("Centang persetujuan untuk melanjutkan.");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setShowTurnstile(true);
      setError("Selesaikan verifikasi singkat di bawah.");
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
          referralCode: searchParams.get("ref") ?? undefined,
          turnstileToken: turnstileToken ?? undefined,
          website: honeypot,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        duplicate?: boolean;
        confirmationEmailScheduled?: boolean;
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
        confirmationEmailScheduled: Boolean(payload.confirmationEmailScheduled),
      });
    } catch {
      setError("Koneksi bermasalah. Periksa internet kamu lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (outcome) {
    const submittedEmail = email.trim();

    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="size-9 text-emerald" strokeWidth={1.5} aria-hidden />
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {outcome.duplicate ? "Sudah terdaftar" : "Kamu masuk waitlist"}
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          {outcome.duplicate ? (
            <>
              <span className="text-foreground">{submittedEmail}</span> sudah ada di daftar kami.
            </>
          ) : (
            <>
              Kami kabari <span className="text-foreground">{submittedEmail}</span> saat Bursa
              dibuka.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3">
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
        <Button
          type="submit"
          size="lg"
          variant="inverse"
          className="h-12 w-full rounded-xl"
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Gabung waitlist"}
        </Button>
      </div>

      <label className="flex items-start justify-center gap-2.5 text-left text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
        <input
          id="waitlist-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (error) setError(null);
          }}
          className="mt-0.5 size-3.5 shrink-0 rounded border-border accent-accent"
          disabled={loading}
        />
        <span>
          Setuju menerima kabar peluncuran Bursa.{" "}
          <Link href="/privasi" className="link-muted text-foreground/80 underline-offset-2">
            Privasi
          </Link>
        </span>
      </label>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0" inert>
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {turnstileRequired && showTurnstile ? (
        <TurnstileWidget
          size="compact"
          onToken={setTurnstileToken}
          className="flex justify-center overflow-hidden rounded-lg"
        />
      ) : null}

      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
