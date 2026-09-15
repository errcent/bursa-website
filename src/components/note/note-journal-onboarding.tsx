"use client";

import { useState } from "react";

import { NoteQuickPrefs } from "@/components/note/note-quick-prefs";
import { noteCopy } from "@/lib/note/copy";
import { DEFAULT_USD_IDR } from "@/lib/note/fx/rates";
import type {
  DisplayCurrency,
  NoteExperience,
  NoteJournalFocus,
  NoteLocale,
  NotePersonalization,
  NotePrimaryMarket,
} from "@/lib/note/prefs";
import { cn } from "@/lib/utils";

function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
            value === v
              ? "border-[var(--chart-info-strong)]/45 bg-[var(--chart-info-track)] text-zinc-100"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function NoteJournalOnboarding({
  locale: initialLocale,
  currency: initialCurrency,
  onComplete,
}: {
  locale: NoteLocale;
  currency: DisplayCurrency;
  onComplete: (patch: {
    locale: NoteLocale;
    currency: DisplayCurrency;
    usdIdrRate: number;
    personalization: NotePersonalization;
    onboardingCompleted: true;
    heroRange?: "all" | "month";
  }) => void;
}) {
  const [step, setStep] = useState(0);
  const [locale, setLocale] = useState(initialLocale);
  const [currency, setCurrency] = useState(initialCurrency);
  const [usdIdrRate, setUsdIdrRate] = useState(DEFAULT_USD_IDR);
  const [market, setMarket] = useState<NotePrimaryMarket>("mixed");
  const [experience, setExperience] = useState<NoteExperience>("menengah");
  const [focus, setFocus] = useState<NoteJournalFocus>("semua");

  const copy = noteCopy(locale);
  const t = (id: string, en: string) => (locale === "en" ? en : id);

  const finish = () => {
    const personalization: NotePersonalization = {
      primaryMarket: market,
      experience,
      journalFocus: focus,
    };
    onComplete({
      locale,
      currency,
      usdIdrRate,
      personalization,
      onboardingCompleted: true,
      ...(focus === "edge" ? { heroRange: "month" as const } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-onboarding-title"
      >
        {step === 0 ? (
          <div className="space-y-4">
            <h2 id="note-onboarding-title" className="font-heading text-xl font-semibold text-zinc-50">
              {t("Selamat datang di Bursa Note", "Welcome to Bursa Note")}
            </h2>
            <p className="text-sm text-zinc-400">
              {t(
                "Atur tampilan jurnal dan jawab beberapa pertanyaan singkat. Bisa diubah kapan saja dari profil (kiri bawah).",
                "Set how your journal looks and answer a few short questions. Change anytime from the profile control (bottom left)."
              )}
            </p>
            <button
              type="button"
              className="w-full rounded-md bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white"
              onClick={() => setStep(1)}
            >
              {t("Mulai", "Start")}
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-zinc-50">
                {t("Preferensi tampilan", "Display preferences")}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {t("Bahasa dan mata uang tampilan PnL.", "Language and PnL display currency.")}
              </p>
            </div>
            <NoteQuickPrefs
              locale={locale}
              currency={currency}
              usdIdrRate={usdIdrRate}
              onLocale={setLocale}
              onCurrency={setCurrency}
              onUsdIdrRate={setUsdIdrRate}
              copy={copy}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-md border border-zinc-700 py-2 text-sm text-zinc-300"
                onClick={() => setStep(0)}
              >
                {t("Kembali", "Back")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-md bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
                onClick={() => setStep(2)}
              >
                {t("Lanjut", "Continue")}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-200">
              {t("Pasar utama yang kamu catat?", "Which markets do you mainly log?")}
            </p>
            <OptionRow
              value={market}
              onChange={setMarket}
              options={[
                ["fx", t("Forex / CFD", "Forex / CFD")],
                ["saham", t("Saham", "Equities")],
                ["komoditi", t("Komoditi / emas", "Commodities / gold")],
                ["mixed", t("Campuran", "Mixed")],
              ]}
            />
            <NavBackNext
              locale={locale}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-200">
              {t("Pengalaman trading-mu?", "Your trading experience?")}
            </p>
            <OptionRow
              value={experience}
              onChange={setExperience}
              options={[
                ["baru", t("Baru mulai catat", "Just starting to log")],
                ["menengah", t("Sudah rutin beberapa bulan", "Logging for a few months")],
                ["rutin", t("Journal sudah jadi kebiasaan", "Journal is a habit")],
              ]}
            />
            <NavBackNext locale={locale} onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-200">
              {t("Fokus personalisasi jurnal?", "Journal personalization focus?")}
            </p>
            <OptionRow
              value={focus}
              onChange={setFocus}
              options={[
                ["disiplin", t("Disiplin & aturan", "Discipline & rules")],
                ["edge", t("Edge & performa", "Edge & performance")],
                ["semua", t("Seimbang / semua", "Balanced / all")],
              ]}
            />
            <NavBackNext locale={locale} onBack={() => setStep(3)} onNext={finish} nextLabel={t("Selesai", "Finish")} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NavBackNext({
  locale,
  onBack,
  onNext,
  nextLabel,
}: {
  locale: NoteLocale;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        className="flex-1 rounded-md border border-zinc-700 py-2 text-sm text-zinc-300"
        onClick={onBack}
      >
        {t("Kembali", "Back")}
      </button>
      <button
        type="button"
        className="flex-1 rounded-md bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
        onClick={onNext}
      >
        {nextLabel ?? t("Lanjut", "Continue")}
      </button>
    </div>
  );
}
