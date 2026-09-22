"use client";

import type { ReactNode } from "react";

import {
  DEFAULT_NOTE_PREFS,
  type DisplayCurrency,
  type NoteLocale,
  type NotePrefs,
  type NoteTheme,
} from "@/lib/note/prefs";
import { noteCopy } from "@/lib/note/copy";
import { NoteJournalDefaults } from "@/components/note/note-journal-defaults";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-zinc-800/80 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="max-w-sm">
        <p className="text-sm text-zinc-200">{label}</p>
        {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice<T extends string | boolean | number>({
  value,
  current,
  onChange,
  children,
}: {
  value: T;
  current: T;
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={
        selected
          ? "inline-flex min-h-9 coarse:min-h-11 min-w-9 coarse:min-w-11 items-center justify-center rounded-md bg-zinc-100 px-3 text-sm text-zinc-950"
          : "inline-flex min-h-9 coarse:min-h-11 min-w-9 coarse:min-w-11 items-center justify-center rounded-md px-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      }
    >
      {children}
    </button>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="pt-8 text-sm font-medium text-zinc-300 first:pt-0">{children}</h2>;
}

export function NoteSettingsForm() {
  const [prefs, update] = useNotePrefs();
  const copy = noteCopy(prefs.locale);

  return (
    <div className="max-w-2xl">
      <Heading>{copy.tampilan}</Heading>
      <p className="mt-3 text-xs leading-relaxed text-zinc-400">
        {prefs.locale === "en"
          ? "Language and currency also live in the Profile menu. This page is the full list."
          : "Bahasa dan mata uang juga ada di menu Profil. Halaman ini daftar lengkapnya."}
      </p>
      <p className="mt-2 text-xs text-zinc-400">{copy.noStreak}</p>

      <Row label={copy.theme} hint={copy.themeHint}>
        <Choice value={"dark" as NoteTheme} current={prefs.theme} onChange={(theme) => update({ theme })}>
          {copy.themeDark}
        </Choice>
        <Choice value={"light" as NoteTheme} current={prefs.theme} onChange={(theme) => update({ theme })}>
          {copy.themeLight}
        </Choice>
        <Choice value={"system" as NoteTheme} current={prefs.theme} onChange={(theme) => update({ theme })}>
          {copy.themeSystem}
        </Choice>
      </Row>
      <Row label={copy.language} hint={copy.languageHint}>
        <Choice value={"id" as NoteLocale} current={prefs.locale} onChange={(locale) => update({ locale })}>
          Indonesia
        </Choice>
        <Choice value={"en" as NoteLocale} current={prefs.locale} onChange={(locale) => update({ locale })}>
          English
        </Choice>
      </Row>
      <Row label={copy.currency} hint={copy.currencyHint}>
        {(["IDR", "USD", "USDT"] as DisplayCurrency[]).map((currency) => (
          <Choice key={currency} value={currency} current={prefs.currency} onChange={(value) => update({ currency: value })}>
            {currency}
          </Choice>
        ))}
      </Row>
      <Row label={copy.privacyMode} hint={copy.privacyModeHint}>
        <Choice value={false} current={prefs.privacyMode} onChange={(privacyMode) => update({ privacyMode })}>
          {prefs.locale === "en" ? "Off" : "Mati"}
        </Choice>
        <Choice value={true} current={prefs.privacyMode} onChange={(privacyMode) => update({ privacyMode })}>
          {prefs.locale === "en" ? "On" : "Nyala"}
        </Choice>
      </Row>
      <Heading>{copy.angka}</Heading>
      <Row label={copy.numberFormat} hint={copy.numberFormatCompactHint}>
        <Choice value={"compact" as const} current={prefs.numberFormat} onChange={(numberFormat) => update({ numberFormat })}>
          {copy.compact}
        </Choice>
        <Choice value={"full" as const} current={prefs.numberFormat} onChange={(numberFormat) => update({ numberFormat })}>
          {copy.full}
        </Choice>
      </Row>
      <Row label={copy.heroNet} hint={copy.heroNetHint}>
        <Choice value={"all" as const} current={prefs.heroRange} onChange={(heroRange) => update({ heroRange })}>
          {copy.allFilter}
        </Choice>
        <Choice value={"month" as const} current={prefs.heroRange} onChange={(heroRange) => update({ heroRange })}>
          {copy.visibleMonth}
        </Choice>
      </Row>
      <Row label={copy.decimals}>
        {([0, 1, 2] as const).map((decimals) => (
          <Choice key={decimals} value={decimals} current={prefs.decimals} onChange={(value) => update({ decimals: value })}>
            {decimals}
          </Choice>
        ))}
      </Row>
      <Row label={copy.lossStyle}>
        <Choice value={"minus" as const} current={prefs.lossStyle} onChange={(lossStyle) => update({ lossStyle })}>
          {copy.minus}
        </Choice>
        <Choice value={"paren" as const} current={prefs.lossStyle} onChange={(lossStyle) => update({ lossStyle })}>
          {copy.paren}
        </Choice>
      </Row>
      <Row label={copy.colorMode} hint={copy.colorModePatternHint}>
        <Choice value={"hue" as const} current={prefs.colorMode} onChange={(colorMode) => update({ colorMode })}>
          {copy.hue}
        </Choice>
        <Choice value={"pattern" as const} current={prefs.colorMode} onChange={(colorMode) => update({ colorMode })}>
          {copy.pattern}
        </Choice>
      </Row>

      <Heading>{copy.journal}</Heading>
      <Row label={copy.calendarNumbers}>
        <Choice value={true} current={prefs.calendarShowNet} onChange={(calendarShowNet) => update({ calendarShowNet })}>
          {copy.show}
        </Choice>
        <Choice value={false} current={prefs.calendarShowNet} onChange={(calendarShowNet) => update({ calendarShowNet })}>
          {copy.dateOnly}
        </Choice>
      </Row>
      <Row label={copy.weekStart}>
        <Choice value={"sunday" as const} current={prefs.weekStart} onChange={(weekStart) => update({ weekStart })}>
          {copy.sunday}
        </Choice>
        <Choice value={"monday" as const} current={prefs.weekStart} onChange={(weekStart) => update({ weekStart })}>
          {copy.monday}
        </Choice>
      </Row>
      <Row label={copy.density}>
        <Choice value={"comfortable" as const} current={prefs.density} onChange={(density) => update({ density })}>
          {copy.comfortable}
        </Choice>
        <Choice value={"compact" as const} current={prefs.density} onChange={(density) => update({ density })}>
          {copy.dense}
        </Choice>
      </Row>
      <div className="pt-6">
        <NoteJournalDefaults />
      </div>
      <p className="pt-6 text-xs text-zinc-400">{copy.locked}</p>
      <button
        type="button"
        className="mt-4 inline-flex min-h-9 coarse:min-h-11 items-center text-xs text-zinc-400 hover:text-zinc-200"
        onClick={() => {
          const reset: NotePrefs = { ...DEFAULT_NOTE_PREFS };
          update(reset);
        }}
      >
        {copy.reset}
      </button>
    </div>
  );
}
