"use client";

import { useState, type FormEvent } from "react";

import type { LegalLocale } from "@/lib/hosts/hosts";
import { trustCopy } from "@/lib/trust/public-posture";

const LABELS = {
  id: {
    name: "Nama",
    org: "Organisasi",
    email: "Email",
    topic: "Keperluan",
    topics: [
      { value: "questionnaire", label: "Kuesioner keamanan vendor" },
      { value: "dpa", label: "DPA / perjanjian data" },
      { value: "controls", label: "Klarifikasi kontrol" },
      { value: "other", label: "Lainnya" },
    ],
    message: "Pesan",
    submit: "Buka email ke security@",
    hint: "Form ini membuka klien email Anda. Tidak ada NDA dan tidak ada laporan audit untuk diunduh.",
  },
  en: {
    name: "Name",
    org: "Organisation",
    email: "Email",
    topic: "Topic",
    topics: [
      { value: "questionnaire", label: "Vendor security questionnaire" },
      { value: "dpa", label: "DPA / data agreement" },
      { value: "controls", label: "Control clarification" },
      { value: "other", label: "Other" },
    ],
    message: "Message",
    submit: "Open email to security@",
    hint: "This opens your mail client. There is no NDA flow and no audit report to download.",
  },
} as const;

export function TrustRequestForm({ locale }: { locale: LegalLocale }) {
  const t = trustCopy(locale);
  const labels = LABELS[locale];
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(labels.topics[0].value);
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topicLabel = labels.topics.find((item) => item.value === topic)?.label ?? topic;
    const subject = encodeURIComponent(`Vendor Security Inquiry — ${org || name}`);
    const body = encodeURIComponent(
      [
        `${labels.name}: ${name}`,
        `${labels.org}: ${org}`,
        `${labels.email}: ${email}`,
        `${labels.topic}: ${topicLabel}`,
        "",
        message,
      ].join("\n")
    );
    window.location.href = `mailto:security@bursanalar.com?subject=${subject}&body=${body}`;
  }

  const fieldClass =
    "mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section id="request" className="trust-card scroll-mt-28 p-5 sm:p-6">
      <h2 className="trust-serif text-xl font-semibold">{t.requestTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.requestLead}</p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="block text-xs text-muted-foreground">
          {labels.name}
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-xs text-muted-foreground">
          {labels.org}
          <input className={fieldClass} value={org} onChange={(e) => setOrg(e.target.value)} required />
        </label>
        <label className="block text-xs text-muted-foreground">
          {labels.email}
          <input
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-xs text-muted-foreground">
          {labels.topic}
          <select className={fieldClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
            {labels.topics.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted-foreground sm:col-span-2">
          {labels.message}
          <textarea
            className={`${fieldClass} min-h-28`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="trust-mono rounded-sm bg-primary px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-primary-foreground hover:bg-[#d4b88a]"
          >
            {labels.submit}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">{labels.hint}</p>
        </div>
      </form>
    </section>
  );
}
