"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Eraser,
  FileJson,
  MailX,
  ShieldAlert,
  PenLine,
  X,
} from "lucide-react";
import type { DataSubjectRequestType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import type { LegalLocale } from "@/lib/hosts/hosts";
import { legalHrefsFor } from "@/lib/hosts/hosts";
import { cn } from "@/lib/utils";

type SubjectType = "ACCOUNT" | "NON_ACCOUNT" | "MENTOR_APPLICANT";

const SUBJECT_COPY = {
  id: {
    title: "Saya adalah",
    account: "Pemegang akun",
    nonAccount: "Waitlist / non-akun",
    mentor: "Calon mentor",
    close: "Tutup",
    nextTitle: "Saya ingin",
    already: "Sudah mengajukan?",
    verify: "Verifikasi identitas",
    confirmTitle: "Konfirmasi permintaan",
    name: "Nama lengkap",
    email: "Email terdaftar",
    details: "Uraian permintaan",
    detailsPh: "Jelaskan permintaan secara spesifik.",
    submit: "Kirim permintaan",
    sending: "Mengirim…",
    successTitle: "Permintaan terkirim",
    successBody: "Simpan nomor referensimu untuk melacak status.",
    refLabel: "Nomor referensi",
    track: "Lacak status",
    another: "Ajukan permintaan lain",
    loginHint: "Masuk di bursanalar.com untuk permintaan penghapusan/portabilitas.",
    sendFail: "Permintaan gagal dikirim.",
  },
  en: {
    title: "I am a",
    account: "Account holder",
    nonAccount: "Waitlist / non-account",
    mentor: "Mentor applicant",
    close: "Close",
    nextTitle: "I would like to",
    already: "Already submitted?",
    verify: "Verify your identity",
    confirmTitle: "Confirm your request",
    name: "Full name",
    email: "Registered email",
    details: "Description",
    detailsPh: "Describe the request specifically.",
    submit: "Submit request",
    sending: "Sending…",
    successTitle: "Request received",
    successBody: "Save your reference number to track status.",
    refLabel: "Reference number",
    track: "Track status",
    another: "Submit another request",
    loginHint: "Sign in at bursanalar.com for deletion/portability requests.",
    sendFail: "The request could not be sent.",
  },
} as const;

const ACTION_CARDS: Array<{
  type: DataSubjectRequestType;
  icon: typeof Download;
  id: { title: string; desc: string };
  en: { title: string; desc: string };
}> = [
  {
    type: "ACCESS",
    icon: Download,
    id: { title: "Akses data pribadi", desc: "Minta salinan data yang kami simpan." },
    en: { title: "Access my data", desc: "Request a copy of data we store about you." },
  },
  {
    type: "CORRECTION",
    icon: PenLine,
    id: { title: "Koreksi data", desc: "Perbaiki data yang tidak akurat." },
    en: { title: "Correct my data", desc: "Fix inaccurate personal data." },
  },
  {
    type: "DELETION",
    icon: Eraser,
    id: { title: "Hapus data & akun", desc: "Minta penghapusan data pribadi." },
    en: { title: "Delete my data", desc: "Request erasure of your personal data." },
  },
  {
    type: "WITHDRAW_CONSENT",
    icon: MailX,
    id: { title: "Tarik persetujuan", desc: "Cabut persetujuan pemrosesan non-esensial." },
    en: { title: "Withdraw consent", desc: "Revoke consent for non-essential processing." },
  },
  {
    type: "OBJECTION",
    icon: ShieldAlert,
    id: { title: "Keberatan pemrosesan", desc: "Ajukan keberatan atas pemrosesan tertentu." },
    en: { title: "Object to processing", desc: "Object to specific processing activities." },
  },
  {
    type: "PORTABILITY",
    icon: FileJson,
    id: { title: "Portabilitas data", desc: "Ekspor data dalam format terbaca mesin." },
    en: { title: "Data portability", desc: "Export data in a machine-readable format." },
  },
];

export function DsarWizardModal({ locale = "id" }: { locale?: LegalLocale }) {
  const t = SUBJECT_COPY[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = searchParams?.get("modal");
  const hrefs = legalHrefsFor(locale);

  const [requestType, setRequestType] = useState<DataSubjectRequestType | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("modal");
    const q = params.toString();
    router.push(q ? `?${q}` : "?", { scroll: false });
    setRequestType(null);
    setError(null);
    setReferenceCode(null);
  }, [router, searchParams]);

  useEffect(() => {
    if (modal === "confirm" && !requestType) {
      const stored = sessionStorage.getItem("bursa-dsar-pending-type") as DataSubjectRequestType | null;
      if (stored) setRequestType(stored);
    }
    if (!modal) {
      setRequestType(null);
      setReferenceCode(null);
    }
  }, [modal, requestType]);

  if (!modal) return null;

  async function submitRequest() {
    if (!requestType) return;
    const subjectType = sessionStorage.getItem("bursa-dsar-subject-type") ?? "NON_ACCOUNT";
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/privacy/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          requestType,
          subjectType,
          details,
        }),
      });
      const data = (await res.json()) as { error?: string; referenceCode?: string };
      if (!res.ok) {
        setError(data.error ?? t.sendFail);
        return;
      }
      setReferenceCode(data.referenceCode ?? null);
      sessionStorage.removeItem("bursa-dsar-pending-type");
      sessionStorage.removeItem("bursa-dsar-subject-type");
    } catch {
      setError(t.sendFail);
    } finally {
      setLoading(false);
    }
  }

  function pickSubject(value: SubjectType) {
    sessionStorage.setItem("bursa-dsar-subject-type", value);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("modal", "take-control");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function pickAction(type: DataSubjectRequestType) {
    setRequestType(type);
    sessionStorage.setItem("bursa-dsar-pending-type", type);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("modal", "confirm");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl sm:max-w-2xl">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t.close}
        >
          <X className="size-5" />
        </button>

        {referenceCode ? (
          <div className="pt-2">
            <h2 className="font-heading text-xl font-semibold">{t.successTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.successBody}</p>
            <p className="mt-4 text-sm font-medium">{t.refLabel}</p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-wide">{referenceCode}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" className="privacy-action-primary border-0" onClick={() => router.push(hrefs.dsarStatus)}>
                {t.track}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReferenceCode(null);
                  setFullName("");
                  setEmail("");
                  setDetails("");
                }}
              >
                {t.another}
              </Button>
            </div>
          </div>
        ) : modal === "select-subject" ? (
          <div className="pt-2">
            <h2 className="font-heading text-xl font-semibold">{t.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.already}{" "}
              <button type="button" className="link-muted font-medium text-foreground" onClick={() => router.push(hrefs.dsarStatus)}>
                {t.verify}
              </button>
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {(
                [
                  ["ACCOUNT", t.account],
                  ["NON_ACCOUNT", t.nonAccount],
                  ["MENTOR_APPLICANT", t.mentor],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="rounded-xl border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent-soft/40"
                  onClick={() => pickSubject(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : modal === "take-control" ? (
          <div className="pt-2">
            <h2 className="font-heading text-xl font-semibold">{t.nextTitle}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {ACTION_CARDS.map((card) => {
                const copy = locale === "en" ? card.en : card.id;
                const Icon = card.icon;
                return (
                  <button
                    key={card.type}
                    type="button"
                    className="flex flex-col gap-2 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent-soft/30"
                    onClick={() => pickAction(card.type)}
                  >
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span className="text-sm font-medium">{copy.title}</span>
                    <span className="text-xs text-muted-foreground">{copy.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : modal === "confirm" && requestType ? (
          <div className="pt-2">
            <h2 className="font-heading text-xl font-semibold">{t.confirmTitle}</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {["DELETION", "WITHDRAW_CONSENT", "PORTABILITY"].includes(requestType) ? t.loginHint : null}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="wizard-name" className="text-sm font-medium">
                  {t.name}
                </label>
                <input
                  id="wizard-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="wizard-email" className="text-sm font-medium">
                  {t.email}
                </label>
                <input
                  id="wizard-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="wizard-details" className="text-sm font-medium">
                  {t.details}
                </label>
                <textarea
                  id="wizard-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder={t.detailsPh}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                className={cn("privacy-action-primary w-full border-0")}
                disabled={loading || fullName.length < 2 || email.length < 5 || details.length < 10}
                onClick={submitRequest}
              >
                {loading ? t.sending : t.submit}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
