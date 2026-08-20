"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import {
  isTurnstileClientConfigured,
  TurnstileWidget,
} from "@/components/turnstile-widget";
import {
  L1_EXPERTISE_OPTIONS,
  L1_YEARS_OPTIONS,
  type L1ExpertiseValue,
} from "@/lib/mentor-program/fields";
import { cn } from "@/lib/utils";

const textareaClassName =
  "w-full resize-y rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent/40 focus:shadow-[0_0_20px_var(--glow)] disabled:opacity-50 min-h-[100px]";

interface FormState {
  l1_full_name: string;
  l1_email: string;
  l1_country: string;
  l1_city: string;
  l1_linkedin_url: string;
  l1_website_url: string;
  l1_expertise: L1ExpertiseValue[];
  l1_expertise_other: string;
  l1_primary_expertise: string;
  l1_years_experience: string;
  l1_professional_background: string;
  l1_why_bursanalar: string;
  l1_unique_knowledge: string;
  extra1: string;
  extra2: string;
  extra3: string;
  l1_confirmation: boolean;
}

const initialState: FormState = {
  l1_full_name: "",
  l1_email: "",
  l1_country: "Indonesia",
  l1_city: "",
  l1_linkedin_url: "",
  l1_website_url: "",
  l1_expertise: [],
  l1_expertise_other: "",
  l1_primary_expertise: "",
  l1_years_experience: "",
  l1_professional_background: "",
  l1_why_bursanalar: "",
  l1_unique_knowledge: "",
  extra1: "",
  extra2: "",
  extra3: "",
  l1_confirmation: false,
};

function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const over = value.length > max;
  const under = min != null && value.length > 0 && value.length < min;
  return (
    <p className={cn("text-xs", over || under ? "text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
      {min ? ` (min. ${min})` : ""}
    </p>
  );
}

function ReviewItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 overflow-x-hidden text-sm whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
        {children || "—"}
      </dd>
    </div>
  );
}

function ReviewLink({ href }: { href: string }) {
  if (!href) return "—";
  return (
    <a
      href={href}
      className="break-all text-accent underline-offset-2 hover:underline [overflow-wrap:anywhere]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {href}
    </a>
  );
}

function expertiseLabel(value: string, other: string) {
  if (value === "other") return other.trim() || "Lainnya";
  return L1_EXPERTISE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function MentorApplicationForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [armTurnstile, setArmTurnstile] = useState(false);
  const turnstileRequired = isTurnstileClientConfigured();

  const primaryOptions = useMemo(() => {
    return form.l1_expertise.flatMap((value) => {
      if (value === "other") {
        return form.l1_expertise_other.trim()
          ? [{ value: form.l1_expertise_other.trim(), label: form.l1_expertise_other.trim() }]
          : [];
      }
      const option = L1_EXPERTISE_OPTIONS.find((item) => item.value === value);
      return option ? [option] : [];
    });
  }, [form.l1_expertise, form.l1_expertise_other]);

  const extraLinks = [form.extra1, form.extra2, form.extra3].map((item) => item.trim()).filter(Boolean);
  const yearsLabel =
    L1_YEARS_OPTIONS.find((item) => item.value === form.l1_years_experience)?.label ??
    form.l1_years_experience;
  const expertiseLabels = form.l1_expertise.map((value) =>
    expertiseLabel(value, form.l1_expertise_other),
  );
  const primaryLabel = expertiseLabel(form.l1_primary_expertise, form.l1_expertise_other);

  function toggleExpertise(value: L1ExpertiseValue) {
    setForm((prev) => {
      const selected = prev.l1_expertise.includes(value)
        ? prev.l1_expertise.filter((item) => item !== value)
        : [...prev.l1_expertise, value];
      const primaryStillValid =
        selected.includes(prev.l1_primary_expertise as L1ExpertiseValue) ||
        (selected.includes("other") && prev.l1_primary_expertise === prev.l1_expertise_other.trim());
      return {
        ...prev,
        l1_expertise: selected,
        l1_primary_expertise: primaryStillValid ? prev.l1_primary_expertise : "",
      };
    });
  }

  function goReview() {
    setSubmitError(null);
    const el = formRef.current;
    if (!el) return;
    if (!el.checkValidity()) {
      el.reportValidity();
      return;
    }
    if (form.l1_expertise.length === 0) {
      setSubmitError("Pilih minimal satu keahlian.");
      return;
    }
    if (form.l1_professional_background.trim().length < 40) {
      setSubmitError("Latar belakang minimal 40 karakter.");
      return;
    }
    if (form.l1_why_bursanalar.trim().length < 400) {
      setSubmitError("Jawaban mengapa Bursanalar minimal 400 karakter.");
      return;
    }
    if (form.l1_unique_knowledge.trim().length < 400) {
      setSubmitError("Jawaban pengetahuan unik minimal 400 karakter.");
      return;
    }
    setStep("review");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goEdit() {
    setSubmitError(null);
    setStep("edit");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (step !== "edit" || event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
    event.preventDefault();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step !== "review") {
      return;
    }
    setSubmitError(null);
    if (!form.l1_confirmation) {
      setSubmitError("Centang konfirmasi sebelum mengirim.");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setArmTurnstile(true);
      setSubmitError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mentor/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          l1_full_name: form.l1_full_name.trim(),
          l1_email: form.l1_email.trim(),
          l1_country: form.l1_country.trim(),
          l1_city: form.l1_city.trim(),
          l1_linkedin_url: form.l1_linkedin_url.trim(),
          l1_website_url: form.l1_website_url.trim() || undefined,
          l1_expertise: form.l1_expertise,
          l1_expertise_other: form.l1_expertise.includes("other")
            ? form.l1_expertise_other.trim()
            : undefined,
          l1_primary_expertise: form.l1_primary_expertise,
          l1_years_experience: form.l1_years_experience,
          l1_professional_background: form.l1_professional_background.trim(),
          l1_why_bursanalar: form.l1_why_bursanalar.trim(),
          l1_unique_knowledge: form.l1_unique_knowledge.trim(),
          l1_extra_links: extraLinks,
          l1_confirmation: form.l1_confirmation,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal mengirim aplikasi.");
      }
      router.push("/jadi-mentor/sukses");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal mengirim aplikasi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="flex min-w-0 scroll-mt-24 flex-col gap-8"
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
    >
      <div className={step === "edit" ? "flex flex-col gap-8" : "hidden"}>
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Tentang kamu</h3>
          <AuthField label="Nama lengkap" id="l1_full_name">
            <input
              id="l1_full_name"
              required
              className={authInputClassName}
              placeholder="Nama lengkap"
              value={form.l1_full_name}
              onChange={(event) => setForm((prev) => ({ ...prev, l1_full_name: event.target.value }))}
            />
          </AuthField>
          <AuthField label="Email" id="l1_email">
            <input
              id="l1_email"
              type="email"
              required
              className={authInputClassName}
              placeholder="kamu@email.com"
              value={form.l1_email}
              onChange={(event) => setForm((prev) => ({ ...prev, l1_email: event.target.value }))}
            />
          </AuthField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Negara" id="l1_country">
              <input
                id="l1_country"
                required
                className={authInputClassName}
                placeholder="Indonesia"
                value={form.l1_country}
                onChange={(event) => setForm((prev) => ({ ...prev, l1_country: event.target.value }))}
              />
            </AuthField>
            <AuthField label="Kota" id="l1_city">
              <input
                id="l1_city"
                required
                className={authInputClassName}
                placeholder="Jakarta"
                value={form.l1_city}
                onChange={(event) => setForm((prev) => ({ ...prev, l1_city: event.target.value }))}
              />
            </AuthField>
          </div>
          <AuthField label="LinkedIn / profil profesional" id="l1_linkedin_url">
            <input
              id="l1_linkedin_url"
              type="url"
              required
              className={authInputClassName}
              placeholder="https://linkedin.com/in/..."
              value={form.l1_linkedin_url}
              onChange={(event) => setForm((prev) => ({ ...prev, l1_linkedin_url: event.target.value }))}
            />
          </AuthField>
          <AuthField label="Situs / profil lain (opsional)" id="l1_website_url">
            <input
              id="l1_website_url"
              type="url"
              className={authInputClassName}
              placeholder="https://"
              value={form.l1_website_url}
              onChange={(event) => setForm((prev) => ({ ...prev, l1_website_url: event.target.value }))}
            />
          </AuthField>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Keahlian</h3>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Keahlian (pilih semua yang relevan)</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {L1_EXPERTISE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.l1_expertise.includes(option.value)}
                    onChange={() => toggleExpertise(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          {form.l1_expertise.includes("other") ? (
            <AuthField label="Jelaskan keahlian lainnya" id="l1_expertise_other">
              <input
                id="l1_expertise_other"
                required
                className={authInputClassName}
                value={form.l1_expertise_other}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, l1_expertise_other: event.target.value }))
                }
              />
            </AuthField>
          ) : null}
          <AuthField label="Keahlian utama" id="l1_primary_expertise">
            <select
              id="l1_primary_expertise"
              required
              className={authInputClassName}
              value={form.l1_primary_expertise}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, l1_primary_expertise: event.target.value }))
              }
            >
              <option value="">Pilih dari keahlian yang sudah dipilih</option>
              {primaryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AuthField>
          <AuthField label="Lama pengalaman relevan" id="l1_years_experience">
            <select
              id="l1_years_experience"
              required
              className={authInputClassName}
              value={form.l1_years_experience}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, l1_years_experience: event.target.value }))
              }
            >
              <option value="">Pilih rentang</option>
              {L1_YEARS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AuthField>
          <AuthField
            label="Latar belakang profesional (singkat)"
            id="l1_professional_background"
            helperText="Ceritakan pengalaman yang paling relevan dengan apa yang bisa kamu ajarkan."
          >
            <textarea
              id="l1_professional_background"
              required
              minLength={40}
              maxLength={500}
              className={textareaClassName}
              value={form.l1_professional_background}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, l1_professional_background: event.target.value }))
              }
            />
            <CharCount value={form.l1_professional_background} max={500} min={40} />
          </AuthField>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Mengapa kamu?</h3>
          <AuthField
            label="Mengapa Bursanalar perlu mempertimbangkan kamu sebagai mentor?"
            id="l1_why_bursanalar"
          >
            <textarea
              id="l1_why_bursanalar"
              required
              minLength={400}
              maxLength={800}
              className={cn(textareaClassName, "min-h-[140px]")}
              value={form.l1_why_bursanalar}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, l1_why_bursanalar: event.target.value }))
              }
            />
            <CharCount value={form.l1_why_bursanalar} max={800} min={400} />
          </AuthField>
          <AuthField
            label="Apa yang bisa kamu ajarkan yang jarang didapat dari kursus trading biasa?"
            id="l1_unique_knowledge"
          >
            <textarea
              id="l1_unique_knowledge"
              required
              minLength={400}
              maxLength={800}
              className={cn(textareaClassName, "min-h-[140px]")}
              value={form.l1_unique_knowledge}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, l1_unique_knowledge: event.target.value }))
              }
            />
            <CharCount value={form.l1_unique_knowledge} max={800} min={400} />
          </AuthField>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Tautan tambahan (opsional)</h3>
          <p className="text-sm text-muted-foreground">
            Maksimal 3 tautan. Jangan mengulang LinkedIn atau situs di atas.
          </p>
          {(["extra1", "extra2", "extra3"] as const).map((key, index) => (
            <AuthField key={key} label={`Tautan ${index + 1}`} id={`l1_extra_links_${index}`}>
              <input
                id={`l1_extra_links_${index}`}
                type="url"
                className={authInputClassName}
                placeholder="https://"
                value={form[key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              />
            </AuthField>
          ))}
        </section>

        {step === "edit" && submitError ? (
          <p className="text-sm text-destructive">{submitError}</p>
        ) : null}

        <Button type="button" className="btn-primary" onClick={goReview}>
          Tinjau dulu
        </Button>
      </div>

      <div className={step === "review" ? "flex flex-col gap-8" : "hidden"}>
        <section className="flex flex-col gap-2">
          <p className="eyebrow">Tinjau draf</p>
          <h3 className="font-heading text-lg font-semibold">Cek ulang sebelum kirim</h3>
          <p className="text-sm text-muted-foreground">
            Baca ringkasan ini. Kalau ada yang mau diubah, kembali ke formulir. Kirim hanya setelah
            yakin — tahap 1 tidak bisa diedit setelah terkirim.
          </p>
        </section>

        <dl className="min-w-0">
          <ReviewItem label="Nama lengkap">{form.l1_full_name}</ReviewItem>
          <ReviewItem label="Email">{form.l1_email}</ReviewItem>
          <ReviewItem label="Lokasi">
            {form.l1_city}, {form.l1_country}
          </ReviewItem>
          <ReviewItem label="LinkedIn">
            <ReviewLink href={form.l1_linkedin_url.trim()} />
          </ReviewItem>
          <ReviewItem label="Situs / profil lain">
            {form.l1_website_url.trim() ? (
              <ReviewLink href={form.l1_website_url.trim()} />
            ) : (
              "—"
            )}
          </ReviewItem>
          <ReviewItem label="Keahlian">{expertiseLabels.join(", ") || "—"}</ReviewItem>
          <ReviewItem label="Keahlian utama">{primaryLabel || "—"}</ReviewItem>
          <ReviewItem label="Pengalaman">{yearsLabel || "—"}</ReviewItem>
          <ReviewItem label="Latar belakang profesional">
            {form.l1_professional_background.trim()}
          </ReviewItem>
          <ReviewItem label="Mengapa Bursanalar">{form.l1_why_bursanalar.trim()}</ReviewItem>
          <ReviewItem label="Yang jarang dari kursus biasa">
            {form.l1_unique_knowledge.trim()}
          </ReviewItem>
          <ReviewItem label="Tautan tambahan">
            {extraLinks.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {extraLinks.map((href) => (
                  <li key={href}>
                    <ReviewLink href={href} />
                  </li>
                ))}
              </ul>
            ) : (
              "—"
            )}
          </ReviewItem>
        </dl>

        <label className="flex items-start gap-2 text-sm">
          <input
            id="l1_confirmation"
            type="checkbox"
            checked={form.l1_confirmation}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, l1_confirmation: event.target.checked }))
            }
            required={step === "review"}
          />
          <span>
            Saya menyatakan informasi dalam aplikasi ini akurat dan memahami bahwa mengirim aplikasi
            tidak menjamin diterima sebagai mentor Bursanalar.
          </span>
        </label>

        {(armTurnstile || turnstileRequired) && <TurnstileWidget onToken={setTurnstileToken} />}

        {step === "review" && submitError ? (
          <p className="text-sm text-destructive">{submitError}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={goEdit}>
            Kembali ubah
          </Button>
          <Button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Kirim aplikasi
          </Button>
        </div>
      </div>
    </form>
  );
}
