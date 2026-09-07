"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { LegalLocale } from "@/lib/hosts/hosts";

const COPY = {
  id: {
    title: "Lacak permintaan",
    lead: "Masukkan email dan nomor referensi yang kamu terima saat mengajukan permintaan.",
    email: "Email",
    ref: "Nomor referensi",
    sendOtp: "Kirim kode verifikasi",
    otp: "Kode verifikasi (6 digit)",
    verify: "Lihat status",
    sending: "Mengirim…",
    loading: "Memuat…",
    status: "Status",
    type: "Jenis permintaan",
    submitted: "Diajukan",
    updated: "Diperbarui",
    fail: "Permintaan tidak ditemukan atau kode salah.",
    otpSent: "Kode verifikasi dikirim ke emailmu.",
  },
  en: {
    title: "Track your request",
    lead: "Enter the email and reference number from your submission confirmation.",
    email: "Email",
    ref: "Reference number",
    sendOtp: "Send verification code",
    otp: "Verification code (6 digits)",
    verify: "View status",
    sending: "Sending…",
    loading: "Loading…",
    status: "Status",
    type: "Request type",
    submitted: "Submitted",
    updated: "Updated",
    fail: "Request not found or code invalid.",
    otpSent: "Verification code sent to your email.",
  },
} as const;

type StatusResult = {
  referenceCode: string;
  requestType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function DsarStatusLookup({ locale = "id" }: { locale?: LegalLocale }) {
  const t = COPY[locale];
  const [email, setEmail] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestOtp() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/privacy/data-request/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referenceCode, locale }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t.fail);
        return;
      }
      setOtpSent(true);
      setInfo(t.otpSent);
    } catch {
      setError(t.fail);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/privacy/data-request/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referenceCode, otp }),
      });
      const data = (await res.json()) as StatusResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t.fail);
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError(t.fail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg rounded-2xl border border-border bg-card/80 p-6">
      <h2 className="font-heading text-lg font-semibold">{t.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.lead}</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="status-email" className="text-sm font-medium">
            {t.email}
          </label>
          <input
            id="status-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="status-ref" className="text-sm font-medium">
            {t.ref}
          </label>
          <input
            id="status-ref"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm"
          />
        </div>

        {!otpSent ? (
          <Button
            type="button"
            className="privacy-action-primary border-0"
            disabled={loading || !email || !referenceCode}
            onClick={requestOtp}
          >
            {loading ? t.sending : t.sendOtp}
          </Button>
        ) : (
          <>
            <div>
              <label htmlFor="status-otp" className="text-sm font-medium">
                {t.otp}
              </label>
              <input
                id="status-otp"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm tracking-widest"
              />
            </div>
            <Button
              type="button"
              className="privacy-action-primary border-0"
              disabled={loading || otp.length !== 6}
              onClick={fetchStatus}
            >
              {loading ? t.loading : t.verify}
            </Button>
          </>
        )}

        {info && <p className="text-sm text-emerald-700">{info}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <dl className="mt-4 space-y-2 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.ref}</dt>
              <dd className="font-mono font-medium">{result.referenceCode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.type}</dt>
              <dd>{result.requestType}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.status}</dt>
              <dd className="font-semibold">{result.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.submitted}</dt>
              <dd>{new Date(result.createdAt).toLocaleString(locale === "en" ? "en-US" : "id-ID")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.updated}</dt>
              <dd>{new Date(result.updatedAt).toLocaleString(locale === "en" ? "en-US" : "id-ID")}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
