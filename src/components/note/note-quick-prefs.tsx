"use client";

import type { DisplayCurrency, NoteLocale } from "@/lib/note/prefs";
import { cn } from "@/lib/utils";

type SegProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  compact?: boolean;
};

function Segmented<T extends string>({ label, value, options, onChange, compact }: SegProps<T>) {
  return (
    <div className={cn("space-y-1.5", compact ? "" : "py-0.5")}>
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(opt.value)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
                on
                  ? "border-[var(--chart-info-strong)]/50 bg-[var(--chart-info-track)] text-zinc-100"
                  : "border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  locale: NoteLocale;
  currency: DisplayCurrency;
  usdIdrRate: number;
  onLocale: (locale: NoteLocale) => void;
  onCurrency: (currency: DisplayCurrency) => void;
  onUsdIdrRate: (rate: number) => void;
  copy: {
    language: string;
    currency: string;
    usdIdrRate?: string;
    usdIdrRateHint?: string;
  };
  compact?: boolean;
};

export function NoteQuickPrefs({
  locale,
  currency,
  usdIdrRate,
  onLocale,
  onCurrency,
  onUsdIdrRate,
  copy,
  compact,
}: Props) {
  return (
    <div className={cn("space-y-3", compact ? "px-0.5" : "")}>
      <Segmented
        label={copy.language}
        value={locale}
        onChange={onLocale}
        compact={compact}
        options={[
          { value: "id", label: "ID" },
          { value: "en", label: "EN" },
        ]}
      />
      <Segmented
        label={copy.currency}
        value={currency === "USDT" ? "USD" : currency}
        onChange={(v) => onCurrency(v as DisplayCurrency)}
        compact={compact}
        options={[
          { value: "IDR", label: "IDR" },
          { value: "USD", label: "USD" },
        ]}
      />
      {copy.usdIdrRate ? (
        <div className="space-y-1">
          <span className="text-xs font-medium text-zinc-400">{copy.usdIdrRate}</span>
          <p className="min-h-11 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-2.5 text-sm tabular-nums text-zinc-300">
            {usdIdrRate.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            <span className="ml-1.5 text-[10px] text-emerald-400">● auto</span>
          </p>
          {copy.usdIdrRateHint ? (
            <span className="block text-xs leading-snug text-zinc-400">{copy.usdIdrRateHint}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
