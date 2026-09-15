"use client";

import Link from "next/link";
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  LayoutGrid,
  PenLine,
  RotateCcw,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { buildNoteInsights } from "@/lib/note/insights";
import { noteCopy } from "@/lib/note/copy";
import {
  filterEntries,
  formatPnl,
  loggingStreak,
  summarizeJournal,
} from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import type { NoteLocale } from "@/lib/note/prefs";
import { NOTE_SECTIONS, type NoteSectionId } from "@/lib/note/sections";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  links?: { href: string; label: string }[];
};

type PromptChip = {
  label: string;
  icon: ReactNode;
  iconWrap: string;
  send: string;
};

function sectionLink(id: NoteSectionId, locale: NoteLocale): { href: string; label: string } {
  const sec = NOTE_SECTIONS.find((s) => s.id === id)!;
  return { href: sec.href, label: sec.label[locale] };
}

function followUpLinks(prompt: string, locale: NoteLocale): { href: string; label: string }[] {
  const p = prompt.toLowerCase();
  const ids: NoteSectionId[] = [];
  if (/tilt|revenge|marah|emosi/.test(p)) ids.push("playbook", "analytics");
  else if (/minggu|week|review|drift|edge/.test(p)) ids.push("analytics", "playbook");
  else if (/ekonomi|economic|ff|forex|calendar/.test(p)) ids.push("news");
  else if (/log|entry|cepat|quick/.test(p)) ids.push("journal");
  else if (/ringkas|summary|kondisi|overview|bagus|hancur|summarize/.test(p))
    ids.push("overview", "analytics");
  else if (/more|lain|help|bantuan/.test(p)) ids.push("overview", "journal", "playbook");
  const seen = new Set<string>();
  return ids
    .map((id) => sectionLink(id, locale))
    .filter((l) => {
      if (seen.has(l.href)) return false;
      seen.add(l.href);
      return true;
    });
}

function replyFromPrompt(
  prompt: string,
  locale: "id" | "en",
  ctx: {
    net: string;
    streak: number;
    closed: number;
    winPct: string;
    insights: string[];
    econHint: string | null;
  }
): string {
  const p = prompt.toLowerCase();
  if (/tilt|revenge|marah|emosi/.test(p)) {
    return locale === "en"
      ? `Streak: ${ctx.streak} logging days. ${ctx.insights[0] ?? "Use notes on the next trade if tilt shows up - free form."}`
      : `Streak log: ${ctx.streak} hari. ${ctx.insights[0] ?? "Pakai catatan di trade berikut kalau tilt muncul - bebas."}`;
  }
  if (/minggu|week|review|drift|edge/.test(p)) {
    return locale === "en"
      ? `Net on journal: ${ctx.net} · ${ctx.closed} closes · win ${ctx.winPct}. Open Analytics for expectancy and drift.`
      : `Net jurnal: ${ctx.net} · ${ctx.closed} close · win ${ctx.winPct}. Buka Analytics untuk expectancy dan drift.`;
  }
  if (/ekonomi|economic|ff|forex|calendar/.test(p)) {
    return (
      ctx.econHint ??
      (locale === "en"
        ? "Open News for the economic calendar and countdown, or Forex Factory for full detail."
        : "Buka News untuk kalender ekonomi dan countdown, atau Forex Factory untuk detail penuh.")
    );
  }
  if (/log|entry|cepat|quick/.test(p)) {
    return locale === "en"
      ? "One tap: Journal → + New. Log symbol and PnL; use notes for context. Friction kills logging rate."
      : "Satu tap: Jurnal → + Baru. Isi simbol dan PnL; konteks/perasaan di catatan. Gesekan = log turun.";
  }
  if (/more|lain|help|bantuan/.test(p)) {
    return locale === "en"
      ? "Six sections: Overview (state), Journal (execution), Playbook (rules), Analytics (edge), News (external shock), Notes (thinking)."
      : "Enam bagian: Overview (state), Journal (eksekusi), Playbook (rules), Analytics (edge), News (shock eksternal), Notes (pikiran).";
  }
  if (/ringkas|summary|kondisi|overview|bagus|hancur|summarize/.test(p)) {
    const extra = ctx.insights[1] ? ` ${ctx.insights[1]}` : "";
    return locale === "en"
      ? `${ctx.net} cumulative on logged PnL trades. Win ${ctx.winPct} on ${ctx.closed} closes.${extra}`
      : `${ctx.net} kumulatif di trade ber-PnL. Win ${ctx.winPct} dari ${ctx.closed} close.${extra}`;
  }
  return locale === "en"
    ? "Try prompts below or ask about tilt, your week, or economic events. Not investment advice."
    : "Coba prompt di bawah atau tanya soal tilt, minggu ini, atau event ekonomi. Bukan saran investasi.";
}

function firstName(display: string | null | undefined, locale: "id" | "en") {
  const part = display?.trim().split(/\s+/)[0];
  if (part) return part;
  return locale === "en" ? "there" : "kamu";
}

function PromptChipRow({
  chips,
  onSend,
  compact,
}: {
  chips: PromptChip[];
  onSend: (text: string) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSend(chip.send)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-left text-[12px] text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                chip.iconWrap
              )}
            >
              {chip.icon}
            </span>
            <span className="whitespace-nowrap leading-tight">{chip.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2.5">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSend(chip.send)}
          className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-left text-[13px] text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              chip.iconWrap
            )}
          >
            {chip.icon}
          </span>
          <span className="leading-tight">{chip.label}</span>
        </button>
      ))}
    </div>
  );
}

export function NoteAiAssistant() {
  const { session } = useAuth();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const journal = useNoteJournal();
  const formatOpts = pnlOptsFromPrefs(prefs);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [econHint, setEconHint] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx = useMemo(() => {
    const entries = journal.data?.entries ?? [];
    const scoped = filterEntries(entries, { kind: "ALL", result: "ALL" });
    const pnlRows = scoped.filter((e) => isPnlKind(e.kind));
    const snap = summarizeJournal(pnlRows);
    const insights = buildNoteInsights(pnlRows, snap, prefs.locale).map((i) => i.text);
    return {
      net: formatPnl(snap.pnlSum, formatOpts),
      streak: loggingStreak(scoped),
      closed: snap.closedCount,
      winPct: snap.winRate == null ? "-" : `${Math.round(snap.winRate * 100)}%`,
      insights,
    };
  }, [journal.data, formatOpts, prefs.locale]);

  const chips: PromptChip[] = useMemo(
    () => [
      {
        label: copy.aiPromptSummarize,
        send: copy.aiPromptSummarize,
        icon: <BarChart3 className="size-4 text-sky-400" aria-hidden />,
        iconWrap: "bg-sky-500/15",
      },
      {
        label: copy.aiPromptTilt,
        send: copy.aiPromptTilt,
        icon: <TrendingDown className="note-pnl-down size-4" aria-hidden />,
        iconWrap: "bg-[color-mix(in_srgb,var(--chart-down-strong)_15%,transparent)]",
      },
      {
        label: copy.aiPromptWeek,
        send: copy.aiPromptWeek,
        icon: <CalendarDays className="note-pnl-up size-4" aria-hidden />,
        iconWrap: "bg-[color-mix(in_srgb,var(--chart-up-strong)_15%,transparent)]",
      },
      {
        label: copy.aiPromptEcon,
        send: copy.aiPromptEcon,
        icon: <CalendarDays className="note-warn size-4" aria-hidden />,
        iconWrap: "note-icon-wrap-warn",
      },
      {
        label: copy.aiPromptLog,
        send: copy.aiPromptLog,
        icon: <PenLine className="size-4 text-violet-400" aria-hidden />,
        iconWrap: "bg-violet-500/15",
      },
      {
        label: copy.aiPromptMore,
        send: copy.aiPromptMore,
        icon: <LayoutGrid className="size-4 text-fuchsia-400" aria-hidden />,
        iconWrap: "bg-fuchsia-500/15",
      },
    ],
    [copy]
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const reply = replyFromPrompt(trimmed, prefs.locale, { ...ctx, econHint });
      const links = followUpLinks(trimmed, prefs.locale);
      setMessages((m) => [
        ...m,
        { role: "user", text: trimmed },
        { role: "assistant", text: reply, links: links.length ? links : undefined },
      ]);
      setInput("");
    },
    [ctx, econHint, prefs.locale]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch(
      `/api/note/economic-calendar?locale=${prefs.locale}&impacts=high&currencies=USD&volatility=1`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { events?: { title: string; date: string; timeLabel: string }[] } | null) => {
        if (cancelled || !json?.events?.length) return;
        const next = json.events[0];
        setEconHint(
          prefs.locale === "en"
            ? `High impact next: ${next.title} · ${next.date} ${next.timeLabel} (FF feed).`
            : `High impact: ${next.title} · ${next.date} ${next.timeLabel} (feed FF).`
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, prefs.locale]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!messages.length) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const name = firstName(session?.name ?? session?.email, prefs.locale);
  const greeting =
    prefs.locale === "en" ? `Hi ${name}, ${copy.aiWelcomeBack}` : `Hai ${name}, ${copy.aiWelcomeBack}`;
  const showHero = messages.length === 0;
  const canSend = input.trim().length > 0;

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:bg-black/25"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed z-50 flex flex-col items-end",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]",
          open ? "gap-3" : ""
        )}
      >
        {open ? (
          <section
            id="note-ai-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-ai-panel-title"
            className="flex h-[min(85dvh,640px)] w-[min(calc(100vw-1.5rem),420px)] flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950 shadow-2xl shadow-black/60"
          >
            <header className="flex shrink-0 items-center gap-2 border-b border-zinc-800/80 px-3 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                  <Sparkles className="note-pnl-up size-4" aria-hidden />
                </div>
                <div className="min-w-0 text-left">
                  <h2
                    id="note-ai-panel-title"
                    className="truncate font-heading text-sm font-semibold text-zinc-50"
                  >
                    {copy.aiTitle}
                  </h2>
                  <p className="truncate text-[11px] text-zinc-500">{copy.aiModeLabel}</p>
                </div>
              </div>
              {messages.length > 0 ? (
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  onClick={resetChat}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  {copy.aiNewChat}
                </button>
              ) : null}
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                aria-label={copy.tutup}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-b border-zinc-800/60 px-4 py-2 text-[11px] text-zinc-500">
              <span>
                <span className="text-zinc-600">{copy.aiStatNet}</span>{" "}
                <span className="font-medium tabular-nums text-zinc-300">{ctx.net}</span>
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="text-zinc-600">{copy.aiStatStreak}</span>{" "}
                <span className="font-medium tabular-nums text-zinc-300">{ctx.streak}d</span>
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="text-zinc-600">{copy.aiStatWin}</span>{" "}
                <span className="font-medium tabular-nums text-zinc-300">{ctx.winPct}</span>
              </span>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-3">
              {showHero ? (
                <div className="flex flex-col items-center px-1 pb-4 text-center">
                  <h3 className="font-heading text-[1.15rem] font-semibold leading-snug tracking-tight text-zinc-50 sm:text-xl">
                    {greeting}
                  </h3>
                  <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-zinc-400">{copy.aiWelcomeSub}</p>
                  {econHint ? (
                    <p className="note-surface-warn-muted mt-3 w-full max-w-none rounded-lg border px-3 py-2 text-left text-[11px] leading-snug">
                      {econHint}
                    </p>
                  ) : null}
                  <div className="mt-6 w-full">
                    <p className="mb-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-600">
                      {copy.aiQuickPrompts}
                    </p>
                    <PromptChipRow chips={chips} onSend={send} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {journal.loading ? (
                    <p className="text-xs text-zinc-500">…</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex flex-col gap-2",
                          msg.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug",
                            msg.role === "user"
                              ? "bg-zinc-800 text-zinc-100"
                              : "bg-zinc-900/90 text-zinc-300"
                          )}
                        >
                          {msg.text}
                        </div>
                        {msg.role === "assistant" && msg.links?.length ? (
                          <div className="flex max-w-[92%] flex-wrap gap-1.5">
                            {msg.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
                                onClick={() => setOpen(false)}
                              >
                                {link.label} →
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/95 p-3 pt-2">
              {!showHero ? (
                <div className="mb-2.5">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                    {copy.aiQuickPrompts}
                  </p>
                  <PromptChipRow chips={chips} onSend={send} compact />
                </div>
              ) : null}
              <form
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2.5 shadow-inner"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={copy.aiAskAnything}
                    className="min-w-0 flex-1 bg-transparent px-1 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                      canSend
                        ? "bg-[var(--chart-up-strong)] text-zinc-950 hover:opacity-90"
                        : "bg-zinc-800 text-zinc-600"
                    )}
                    aria-label={copy.aiSend}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
                  <span className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    {copy.aiDisclaimer}
                  </span>
                  <Link
                    href="/note/analytics"
                    className="text-[11px] font-medium text-zinc-400 hover:text-zinc-100"
                    onClick={() => setOpen(false)}
                  >
                    {copy.aiShortcuts} →
                  </Link>
                </div>
              </form>
            </div>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="note-ai-panel"
          className={cn(
            "flex size-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-lg shadow-black/40",
            "hover:border-[color-mix(in_srgb,var(--chart-up-strong)_50%,transparent)] hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chart-up-strong)]"
          )}
        >
          {open ? <X className="size-6" aria-hidden /> : <Sparkles className="note-pnl-up size-6" aria-hidden />}
          <span className="sr-only">{open ? copy.tutup : copy.aiTitle}</span>
        </button>
      </div>
    </>
  );
}
