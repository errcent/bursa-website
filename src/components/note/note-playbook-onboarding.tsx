"use client";

import { useState } from "react";

import type { BehaviorSignals } from "@/lib/note/playbook/types";
import { cn } from "@/lib/utils";

type Locale = "id" | "en";

export function NotePlaybookOnboarding({
  locale,
  onComplete,
}: {
  locale: Locale;
  onComplete: (signals: BehaviorSignals) => void;
}) {
  const [step, setStep] = useState(0);
  const [freq, setFreq] = useState<BehaviorSignals["tradeFrequency"]>("medium");
  const [loss, setLoss] = useState<"stop" | "normal" | "recover" | "size_up">("normal");
  const [discipline, setDiscipline] = useState<BehaviorSignals["entryDiscipline"]>("mixed");
  const [conf, setConf] = useState<"consistent" | "size_up" | "aggressive" | "very_conf">("consistent");

  const t = (id: string, en: string) => (locale === "en" ? en : id);

  const mapSignals = (): BehaviorSignals => {
    const lossResponse: BehaviorSignals["lossResponse"] =
      loss === "recover" || loss === "size_up"
        ? loss === "size_up"
          ? "overcorrect"
          : "revenge"
        : "stable";
    const confidenceShift: BehaviorSignals["confidenceShift"] =
      conf === "consistent"
        ? "stable"
        : conf === "very_conf" || conf === "aggressive"
          ? "overconfident"
          : "overconfident";
    return {
      tradeFrequency: freq,
      lossResponse,
      entryDiscipline: discipline,
      confidenceShift,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {step === 0 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-zinc-50">
              {t("Atur setup trading", "Set your trading setup")}
            </h2>
            <p className="text-sm text-zinc-400">
              {t(
                "Ini menyesuaikan intensitas check & risk. Setup trading kamu tulis sendiri di Playbook (bukan preset ICT/breakout).",
                "This tunes check intensity & risk. You define your own setups in Playbook (no forced ICT/breakout presets)."
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
              <p className="text-sm font-medium text-zinc-200">
                {t("Seberapa sering kamu trade?", "How often do you usually trade?")}
              </p>
              <OptionRow
                options={[
                  ["low", t("Rendah (1-3/hari)", "Low (1-3/day)")],
                  ["medium", t("Sedang (4-10/hari)", "Medium (4-10/day)")],
                  ["high", t("Tinggi (10+/hari)", "High (10+/day)")],
                ]}
                value={freq}
                onPick={(v) => setFreq(v as typeof freq)}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {t("Setelah trade rugi?", "After a losing trade?")}
              </p>
              <OptionRow
                options={[
                  ["stop", t("Berhenti / break", "Stop / take a break")],
                  ["normal", t("Lanjut normal", "Continue normally")],
                  ["recover", t("Buruk balik cepat", "Try to recover quickly")],
                  ["size_up", t("Naikkan size", "Increase size to recover")],
                ]}
                value={loss}
                onPick={(v) => setLoss(v as typeof loss)}
              />
            </div>
            <NavButtons locale={locale} onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {t("Gaya keputusan?", "Decision style?")}
              </p>
              <OptionRow
                options={[
                  ["strict", t("Checklist ketat", "Strict checklist")],
                  ["mixed", t("Campuran rules + intuisi", "Mixed rules + intuition")],
                  ["impulsive", t("Cepat / insting", "Fast / instinct")],
                ]}
                value={discipline}
                onPick={(v) => setDiscipline(v as typeof discipline)}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {t("Setelah winning streak?", "After a winning streak?")}
              </p>
              <OptionRow
                options={[
                  ["consistent", t("Tetap konsisten", "Stay consistent")],
                  ["size_up", t("Sedikit naik size", "Slightly increase size")],
                  ["aggressive", t("Trade lebih agresif", "Trade more aggressively")],
                  ["very_conf", t("Sangat percaya diri", "Feel very confident")],
                ]}
                value={conf}
                onPick={(v) => setConf(v as typeof conf)}
              />
            </div>
            <NavButtons locale={locale} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-zinc-100">
              {t("Siap. Pengalaman akan disesuaikan.", "Got it. We will adjust your experience.")}
            </h2>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li>
                {t("Frekuensi", "Frequency")}: {freq}
              </li>
              <li>
                {t("Respons loss", "Loss response")}: {loss}
              </li>
              <li>
                {t("Disiplin", "Discipline")}: {discipline}
              </li>
            </ul>
            <p className="text-xs text-zinc-400">
              {t(
                "Playbook akan adapt dari Journal. Tanpa archetype.",
                "Playbook adapts from Journal. No archetype shown."
              )}
            </p>
            <button
              type="button"
              className="w-full rounded-md bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white"
              onClick={() => onComplete(mapSignals())}
            >
              {t("Masuk Playbook", "Enter Playbook")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OptionRow({
  options,
  value,
  onPick,
}: {
  options: [string, string][];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className={cn(
            "rounded-lg border px-3 py-2 text-left text-sm",
            value === v
              ? "border-zinc-100/40 bg-zinc-800 text-zinc-50"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function NavButtons({
  locale,
  onBack,
  onNext,
}: {
  locale: Locale;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button type="button" className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200" onClick={onBack}>
        {locale === "en" ? "Back" : "Kembali"}
      </button>
      <button
        type="button"
        className="flex-1 rounded-md bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
        onClick={onNext}
      >
        {locale === "en" ? "Next" : "Lanjut"}
      </button>
    </div>
  );
}
