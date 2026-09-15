"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { pickNearestEvent } from "@/lib/note/economic-calendar/countdown";
import { eventStartsAtMs } from "@/lib/note/economic-calendar/event-datetime";
import type { EconomicCalendarPayload } from "@/lib/note/economic-calendar/types";
import { NotePlaybookOnboarding } from "@/components/note/note-playbook-onboarding";
import { NotePlaybookNotesBridge } from "@/components/note/note-playbook-notes-bridge";
import { CORE_CHECK_IDS } from "@/lib/note/playbook/check-engine";
import {
  defaultPlaybookState,
  PLAYBOOK_CHECKS,
  PLAYBOOK_SETUP_TEMPLATES,
} from "@/lib/note/playbook/defaults";
import {
  afterRemovingSetup,
  cloneSetupTemplate,
  createBlankSetup,
  resolveActiveSetupId,
} from "@/lib/note/playbook/setup-utils";
import { evaluatePlaybookGate } from "@/lib/note/playbook/gate";
import { recordSuccessfulCheckCycle, syncGateSessionAfterLoss } from "@/lib/note/playbook/gate-session";
import {
  journalGateMetrics,
  lastClosedLossIso,
  minutesSinceLastLoss,
} from "@/lib/note/playbook/metrics";
import { priorWeightsFromSignals, synthesizeProfile } from "@/lib/note/playbook/profile";
import { loadPlaybook, savePlaybook } from "@/lib/note/playbook/storage";
import type {
  BehaviorSignals,
  PlaybookCheckId,
  PlaybookPersisted,
  PlaybookSetup,
  SetupConfidence,
} from "@/lib/note/playbook/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const CONF_LABEL: Record<SetupConfidence, Record<"id" | "en", string>> = {
  high: { id: "Keyakinan tinggi", en: "High confidence" },
  med: { id: "Sedang", en: "Medium" },
  low: { id: "Rendah", en: "Low" },
};

const CONF_CLASS: Record<SetupConfidence, string> = {
  high: "note-surface-up-muted border",
  med: "note-surface-warn-muted border",
  low: "border-zinc-600 bg-zinc-800/50 text-zinc-400",
};

const SIGNAL_UI: {
  key: keyof BehaviorSignals;
  title: Record<"id" | "en", string>;
  options: { value: string; label: Record<"id" | "en", string> }[];
}[] = [
  {
    key: "tradeFrequency",
    title: { id: "Frekuensi trade", en: "Trade frequency" },
    options: [
      { value: "low", label: { id: "Rendah", en: "Low" } },
      { value: "medium", label: { id: "Sedang", en: "Medium" } },
      { value: "high", label: { id: "Tinggi", en: "High" } },
    ],
  },
  {
    key: "lossResponse",
    title: { id: "Respons loss", en: "Loss response" },
    options: [
      { value: "stable", label: { id: "Stabil", en: "Stable" } },
      { value: "revenge", label: { id: "Revenge", en: "Revenge" } },
      { value: "overcorrect", label: { id: "Overcorrect", en: "Overcorrect" } },
    ],
  },
  {
    key: "entryDiscipline",
    title: { id: "Disiplin entry", en: "Entry discipline" },
    options: [
      { value: "strict", label: { id: "Ketat", en: "Strict" } },
      { value: "mixed", label: { id: "Campuran", en: "Mixed" } },
      { value: "impulsive", label: { id: "Impulsif", en: "Impulsive" } },
    ],
  },
  {
    key: "confidenceShift",
    title: { id: "Pergeseran confidence", en: "Confidence shift" },
    options: [
      { value: "stable", label: { id: "Stabil", en: "Stable" } },
      { value: "overconfident", label: { id: "Overconfident", en: "Overconfident" } },
      { value: "underconfident", label: { id: "Underconfident", en: "Underconfident" } },
    ],
  },
];

function minutesToHighImpact(payload: EconomicCalendarPayload | null, nowMs: number): number | null {
  if (!payload?.events?.length) return null;
  const high = payload.events.filter((e) => e.impact === "high");
  const nearest = pickNearestEvent(high, nowMs);
  if (!nearest) return null;
  const ms = eventStartsAtMs(nearest);
  if (ms == null) return null;
  const delta = ms - nowMs;
  if (delta < 0) return null;
  return delta / 60_000;
}

export function NotePlaybookView() {
  const [prefs] = useNotePrefs();
  const locale = prefs.locale;
  const journal = useNoteJournal();
  const [state, setState] = useState<PlaybookPersisted>(defaultPlaybookState);
  const [playbookReady, setPlaybookReady] = useState(false);
  const [newsPayload, setNewsPayload] = useState<EconomicCalendarPayload | null>(null);

  useEffect(() => {
    setState(loadPlaybook());
    setPlaybookReady(true);
  }, []);

  const persist = useCallback((next: PlaybookPersisted) => {
    setState(next);
    savePlaybook(next);
  }, []);

  useEffect(() => {
    void fetch("/api/note/economic-calendar?impacts=high&currencies=USD,EUR,GBP,JPY&locale=" + prefs.locale, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: EconomicCalendarPayload | null) => setNewsPayload(json))
      .catch(() => setNewsPayload(null));
  }, [prefs.locale]);

  const entries = journal.data?.entries ?? [];

  const metrics = useMemo(() => journalGateMetrics(entries), [entries]);

  const liveProfile = useMemo(
    () => synthesizeProfile(state.profile, metrics),
    [state.profile, metrics]
  );

  useEffect(() => {
    if (!journal.data) return;
    const w = liveProfile.weights;
    const prev = state.profile.weights;
    const changed =
      Math.abs(w.overtradeRisk - prev.overtradeRisk) > 0.02 ||
      Math.abs(w.revengeRisk - prev.revengeRisk) > 0.02;
    if (!changed) return;
    const t = window.setTimeout(() => {
      persist({ ...state, profile: liveProfile });
    }, 500);
    return () => window.clearTimeout(t);
  }, [liveProfile, journal.data, persist, state]);

  const gateState = useMemo(
    () => ({ ...state, profile: liveProfile }),
    [state, liveProfile]
  );

  const highImpactMins = useMemo(() => {
    const serverMs = newsPayload?.serverTime ? Date.parse(newsPayload.serverTime) : Date.now();
    const offset = newsPayload?.serverTime ? serverMs - Date.now() : 0;
    return minutesToHighImpact(newsPayload, Date.now() + offset);
  }, [newsPayload]);

  const lossMinutesAgo = useMemo(() => minutesSinceLastLoss(entries), [entries]);

  const lossIso = useMemo(() => lastClosedLossIso(entries), [entries]);

  const gateStateSynced = useMemo(
    () => syncGateSessionAfterLoss(gateState, lossIso),
    [gateState, lossIso]
  );

  const gate = useMemo(
    () =>
      evaluatePlaybookGate(gateStateSynced, metrics, {
        highImpactWithinMinutes: highImpactMins,
        lastLossMinutesAgo: lossMinutesAgo,
        winStreak: metrics.winStreak,
        checkPassesSinceLoss: gateStateSynced.gateSession?.checkPassesSinceLoss,
      }),
    [gateStateSynced, metrics, highImpactMins, lossMinutesAgo]
  );

  const prevVerdict = useRef(gate.verdict);
  useEffect(() => {
    if (prevVerdict.current !== "allow" && gate.verdict === "allow") {
      persist(recordSuccessfulCheckCycle(gateStateSynced));
    }
    prevVerdict.current = gate.verdict;
  }, [gate.verdict, gateStateSynced, persist]);

  const setSignal = <K extends keyof BehaviorSignals>(key: K, value: BehaviorSignals[K]) => {
    const signals = { ...state.profile.signals, [key]: value };
    persist({
      ...state,
      profile: {
        ...state.profile,
        signals,
        weights: priorWeightsFromSignals(signals),
        updatedAt: null,
      },
    });
  };

  const setCheck = (id: PlaybookCheckId, value: boolean) => {
    persist({ ...state, checkAnswers: { ...state.checkAnswers, [id]: value } });
  };

  const resetChecks = () => {
    persist({ ...state, checkAnswers: {} });
  };

  const activeChecks = PLAYBOOK_CHECKS.filter((c) => gate.adapted.activeCheckIds.includes(c.id));

  const updateSetup = (id: string, patch: Partial<PlaybookSetup>) => {
    persist({
      ...state,
      setups: state.setups.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const updateSetupCondition = (id: string, text: string) => {
    persist({
      ...state,
      setups: state.setups.map((s) =>
        s.id === id ? { ...s, condition: { id: text, en: text } } : s
      ),
    });
  };

  const addBlankSetup = () => {
    const next = createBlankSetup(state.setups, locale);
    persist({
      ...state,
      setups: [...state.setups, next],
      activeSetupId: next.id,
    });
  };

  const addTemplateSetup = (templateId: string) => {
    const tpl = PLAYBOOK_SETUP_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const next = cloneSetupTemplate(tpl);
    persist({
      ...state,
      setups: [...state.setups, next],
      activeSetupId: next.id,
    });
  };

  const removeSetup = (id: string) => {
    if (state.setups.length <= 1) return;
    const { setups, activeSetupId } = afterRemovingSetup(state.setups, id, state.activeSetupId);
    persist({ ...state, setups, activeSetupId });
  };

  const toggleSetupEnabled = (id: string) => {
    const setups = state.setups.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    const activeSetupId = resolveActiveSetupId(setups, state.activeSetupId);
    persist({ ...state, setups, activeSetupId });
  };

  const verdictUi =
    gate.verdict === "allow"
      ? {
          title: locale === "en" ? "Checks passed" : "Checklist lolos",
          className: "note-surface-up-muted border",
        }
      : gate.verdict === "conditional"
        ? {
            title: locale === "en" ? "Conditional pass" : "Lolos bersyarat",
            className: "note-surface-warn-muted border",
          }
        : {
            title: locale === "en" ? "Hold - finish checks" : "Tahan - selesaikan check",
            className: "note-surface-down-muted border",
          };

  const intensityLabel =
    gate.adapted.intensity === "strict"
      ? locale === "en"
        ? "Strict"
        : "Ketat"
      : gate.adapted.intensity === "relaxed"
        ? locale === "en"
          ? "Relaxed"
          : "Longgar"
        : locale === "en"
          ? "Balanced"
          : "Seimbang";

  const finishOnboarding = (signals: typeof state.profile.signals) => {
    persist({
      ...state,
      profile: {
        signals,
        weights: priorWeightsFromSignals(signals),
        updatedAt: null,
        onboardingCompleted: true,
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {playbookReady && !state.profile.onboardingCompleted ? (
        <NotePlaybookOnboarding locale={locale} onComplete={finishOnboarding} />
      ) : null}
      <section className="space-y-3">
        <header>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-200">
            {locale === "en" ? "Trading behavior" : "Perilaku trading"}
          </h2>
          <p className="text-xs text-zinc-500">
            {locale === "en"
              ? "Four signals. Journal keeps updating intensity in the background."
              : "Empat sinyal. Journal memperbarui intensitas di belakang layar."}
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {SIGNAL_UI.map((block) => (
            <div key={block.key} className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
              <p className="mb-2 text-xs font-medium text-zinc-300">{block.title[locale]}</p>
              <div className="flex flex-wrap gap-1">
                {block.options.map((opt) => {
                  const active = state.profile.signals[block.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSignal(block.key, opt.value as BehaviorSignals[typeof block.key])}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[11px] font-medium",
                        active
                          ? "bg-zinc-100 text-zinc-950"
                          : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      )}
                    >
                      {opt.label[locale]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600">
          {locale === "en"
            ? "Intensity from journal: auto-adjusted. Not a personality label."
            : "Intensitas dari jurnal: disesuaikan otomatis. Bukan label kepribadian."}
        </p>
      </section>

      <div className={cn("rounded-xl border px-4 py-4 sm:px-5", verdictUi.className)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {locale === "en" ? "Gate" : "Gerbang"}
          </p>
          <span className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-300">
            {intensityLabel}
          </span>
        </div>
        <p className="mt-1 font-heading text-2xl font-bold tracking-tight">{verdictUi.title}</p>
        <p className="mt-1 text-xs tabular-nums text-zinc-400">
          {locale === "en" ? "Core checks" : "Check inti"}: {gate.coreYes}/{CORE_CHECK_IDS.length} ·{" "}
          {locale === "en" ? "need" : "butuh"} {gate.requiredYes} {locale === "en" ? "YES" : "YA"}
        </p>
        {gate.sizeScaleHint < 1 ? (
          <p className="mt-2 text-xs text-zinc-300">
            {locale === "en" ? "Size hint" : "Hint size"}: ~{Math.round(gate.sizeScaleHint * 100)}%
          </p>
        ) : null}
        {gate.blockers.length ? (
          <ul className="mt-3 space-y-1 text-sm text-zinc-300">
            {gate.blockers.slice(0, 6).map((b, i) => (
              <li key={i}>{locale === "en" ? b.en : b.id}</li>
            ))}
          </ul>
        ) : null}
        {gate.warnings.length ? (
          <ul className="note-warn-body mt-2 space-y-1 text-sm">
            {gate.warnings.map((w, i) => (
              <li key={i}>{locale === "en" ? w.en : w.id}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <NotePlaybookNotesBridge />

      <section className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-200">Setup</h2>
            <p className="text-xs text-zinc-500">
              {locale === "en"
                ? "Your rules - name, criteria, and confidence. No preset style forced."
                : "Aturan kamu - nama, kriteria, keyakinan. Tidak ada gaya trade bawaan."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-zinc-500"
              onClick={addBlankSetup}
            >
              {locale === "en" ? "+ Add setup" : "+ Tambah setup"}
            </button>
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span>{locale === "en" ? "Template" : "Contoh"}</span>
              <select
                className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1.5 text-[11px] text-zinc-200"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) addTemplateSetup(v);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  {locale === "en" ? "Optional…" : "Opsional…"}
                </option>
                {PLAYBOOK_SETUP_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <ul className="space-y-3">
          {state.setups.map((setup) => {
            const active = state.activeSetupId === setup.id;
            return (
              <li
                key={setup.id}
                className={cn(
                  "rounded-lg border px-3 py-3 transition-colors",
                  active ? "border-zinc-100/25 bg-zinc-800/50 ring-1 ring-zinc-100/10" : "border-zinc-800 bg-zinc-900/40",
                  !setup.enabled && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setup.enabled && persist({ ...state, activeSetupId: setup.id })}
                    disabled={!setup.enabled}
                    className={cn(
                      "mt-0.5 size-4 shrink-0 rounded-full border",
                      active && setup.enabled
                        ? "border-[var(--chart-up-strong)] bg-[var(--chart-up-strong)]"
                        : "border-zinc-600 bg-transparent"
                    )}
                    aria-label={locale === "en" ? "Active setup" : "Setup aktif"}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={setup.name}
                        onChange={(e) => updateSetup(setup.id, { name: e.target.value })}
                        className="min-w-[8rem] flex-1 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-sm font-medium text-zinc-100"
                        aria-label={locale === "en" ? "Setup name" : "Nama setup"}
                      />
                      <select
                        value={setup.confidence}
                        onChange={(e) =>
                          updateSetup(setup.id, { confidence: e.target.value as SetupConfidence })
                        }
                        className={cn(
                          "rounded border px-1.5 py-1 text-[10px] font-semibold",
                          CONF_CLASS[setup.confidence]
                        )}
                        aria-label={locale === "en" ? "Confidence" : "Keyakinan"}
                      >
                        {(Object.keys(CONF_LABEL) as SetupConfidence[]).map((k) => (
                          <option key={k} value={k}>
                            {CONF_LABEL[k][locale]}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <input
                          type="checkbox"
                          checked={setup.enabled}
                          onChange={() => toggleSetupEnabled(setup.id)}
                        />
                        {locale === "en" ? "On" : "Aktif"}
                      </label>
                      {state.setups.length > 1 ? (
                        <button
                          type="button"
                          className="text-[10px] text-zinc-600 hover:text-red-400"
                          onClick={() => removeSetup(setup.id)}
                        >
                          {locale === "en" ? "Remove" : "Hapus"}
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      value={setup.condition[locale]}
                      onChange={(e) => updateSetupCondition(setup.id, e.target.value)}
                      rows={2}
                      className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-1.5 text-xs leading-snug text-zinc-300 placeholder:text-zinc-600"
                      placeholder={
                        locale === "en"
                          ? "When is this setup valid for you?"
                          : "Kapan setup ini valid buat kamu?"
                      }
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-200">Check</h2>
            <p className="text-xs text-zinc-500">
              {locale === "en"
                ? `Deterministic · core ${gate.requiredYes}/${CORE_CHECK_IDS.length} YES`
                : `Deterministik · core ${gate.requiredYes}/${CORE_CHECK_IDS.length} YA`}
            </p>
          </div>
          <button type="button" className="text-[11px] text-zinc-500 hover:text-zinc-200" onClick={resetChecks}>
            {locale === "en" ? "Reset checks" : "Reset check"}
          </button>
        </header>
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800/80">
          {activeChecks.map((check) => {
            const answer = state.checkAnswers[check.id];
            return (
              <li key={check.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <span className="text-sm text-zinc-200">
                  {check.label[locale]}
                  {check.critical ? (
                    <span className="note-mark-warn ml-1 text-[10px]">*</span>
                  ) : null}
                </span>
                <div className="flex gap-1 rounded-md border border-zinc-800 p-0.5">
                  {(
                    [
                      [true, locale === "en" ? "YES" : "YA"],
                      [false, locale === "en" ? "NO" : "TIDAK"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={answer === val}
                      onClick={() => setCheck(check.id, val)}
                      className={cn(
                        "rounded px-3 py-1 text-xs font-semibold",
                        answer === val
                          ? val
                            ? "note-chip-up"
                            : "note-chip-down"
                          : "text-zinc-500 hover:text-zinc-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        {highImpactMins != null && highImpactMins <= gate.adapted.rules.blockMinutesBeforeHighImpact ? (
          <p className="note-warn-body text-[11px]">
            {locale === "en"
              ? `High-impact event in ~${Math.ceil(highImpactMins)} min.`
              : `Event high-impact ~${Math.ceil(highImpactMins)} menit lagi.`}{" "}
            <Link href="/note/news" className="note-link-warn underline">
              News
            </Link>
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-200">Risk</h2>
          <p className="text-xs text-zinc-500">
            {locale === "en"
              ? "Hard bounds (baseline editable, effective limits adapt)."
              : "Batas keras (baseline bisa edit, limit efektif adaptif)."}
          </p>
        </header>
        <dl className="grid gap-3 sm:grid-cols-2">
          <RuleField
            label={locale === "en" ? "Baseline max risk / trade (%)" : "Baseline max risk / trade (%)"}
            value={state.rules.maxRiskPerTradePct}
            onChange={(v) => persist({ ...state, rules: { ...state.rules, maxRiskPerTradePct: v } })}
          />
          <RuleField
            label={
              locale === "en"
                ? `Baseline max daily loss (${prefs.currency})`
                : `Baseline max loss harian (${prefs.currency})`
            }
            value={state.rules.maxDailyLoss}
            onChange={(v) => persist({ ...state, rules: { ...state.rules, maxDailyLoss: v } })}
          />
          <RuleField
            label={locale === "en" ? "Baseline max trades / session" : "Baseline max trade / sesi"}
            value={state.rules.maxTradesPerSession}
            onChange={(v) => persist({ ...state, rules: { ...state.rules, maxTradesPerSession: v } })}
          />
          <RuleField
            label={locale === "en" ? "Baseline news block (min)" : "Baseline blok news (min)"}
            value={state.rules.blockMinutesBeforeHighImpact}
            onChange={(v) =>
              persist({ ...state, rules: { ...state.rules, blockMinutesBeforeHighImpact: v } })
            }
          />
        </dl>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-3 text-xs text-zinc-500">
          <p className="font-medium text-zinc-400">
            {locale === "en" ? "Effective limits (now)" : "Limit efektif (sekarang)"}
          </p>
          <p className="mt-1 tabular-nums text-zinc-300">
            {locale === "en" ? "Max trades" : "Max trade"}: {gate.adapted.rules.maxTradesPerSession}
            {" · "}
            {locale === "en" ? "News block" : "Blok news"}: {gate.adapted.rules.blockMinutesBeforeHighImpact}m
            {" · "}
            {locale === "en" ? "Loss streak stop" : "Stop streak loss"}:{" "}
            {gate.adapted.rules.stopAfterConsecutiveLosses}
            {" · "}
            {locale === "en" ? "Cooldown after loss" : "Cooldown setelah loss"}:{" "}
            {gate.adapted.rules.cooldownMinutesAfterLoss}m
          </p>
          <p className="mt-2 tabular-nums">
            {locale === "en" ? "Journal today" : "Jurnal hari ini"}: {metrics.tradesToday} · PnL{" "}
            {metrics.dailyPnl} · {locale === "en" ? "Open" : "Open"} {metrics.openCount}
          </p>
        </div>
      </section>
    </div>
  );
}

function RuleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="text-zinc-500">{label}</span>
      <input
        type="number"
        min={0}
        step="any"
        className="mt-1 h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 tabular-nums text-zinc-100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}
