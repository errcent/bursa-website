"use client";

import { useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";

/**
 * Ask Your Journal panel. Deterministic answers always work ($0, no key).
 * Optional BYOK LLM deepens the answer with cited aggregates only —
 * pasted keys are used for one request and never stored.
 */
interface AskResult {
  answer: { intent: string; text: string; citations: string[] };
  llm: { text: string; provider: string; citations: string[] } | null;
  retrieval: string;
  quotaNote?: string;
}

export function NoteAskPanel() {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [question, setQuestion] = useState("");
  const [symbols, setSymbols] = useState("");
  const [provider, setProvider] = useState<"none" | "anthropic" | "openai">("none");
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (question.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        question: question.trim(),
        symbols: symbols.split(/[,\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean),
        locale: prefs.locale,
      };
      if (provider !== "none") {
        body.provider = provider;
        if (apiKey.trim()) body.apiKey = apiKey.trim();
      }
      const res = await fetch("/api/note/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as AskResult & { error?: string };
      if (!res.ok || !json.answer) {
        setError(typeof json.error === "string" ? json.error : t("Gagal menjawab.", "Could not answer."));
      } else {
        setResult(json);
      }
    } catch {
      setError(t("Jaringan gagal.", "Network failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {t("Tanya jurnalmu", "Ask your journal")}
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          className="note-field min-h-9 coarse:min-h-11 flex-1 text-sm text-zinc-100"
          placeholder={t("cth: berapa win rate EURUSD?", "e.g. what is my EURUSD win rate?")}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask();
          }}
          aria-label={t("Pertanyaan", "Question")}
        />
        <button
          type="button"
          disabled={busy || question.trim().length < 3}
          onClick={() => void ask()}
          className="inline-flex min-h-9 coarse:min-h-11 shrink-0 items-center justify-center rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
        >
          {t("Tanya", "Ask")}
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          className="note-field min-h-9 coarse:min-h-11 flex-1 text-sm text-zinc-100"
          placeholder={t("Filter simbol (opsional): EURUSD, XAUUSD", "Symbol filter (optional)")}
          value={symbols}
          onChange={(e) => setSymbols(e.target.value)}
          aria-label={t("Filter simbol", "Symbol filter")}
        />
        <select
          className="note-field min-h-9 coarse:min-h-11 text-sm"
          value={provider}
          onChange={(e) => setProvider(e.target.value as "none" | "anthropic" | "openai")}
          aria-label="LLM"
        >
          <option value="none">{t("Tanpa LLM ($0)", "No LLM ($0)")}</option>
          <option value="anthropic">Anthropic BYOK</option>
          <option value="openai">OpenAI BYOK</option>
        </select>
      </div>
      {provider !== "none" ? (
        <input
          type="password"
          autoComplete="off"
          className="note-field mt-2 block min-h-9 coarse:min-h-11 w-full text-sm text-zinc-100"
          placeholder={t("API key (dipakai sekali, tidak disimpan — kosongkan = kunci server)", "API key (single-request, never stored — blank = server key)")}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          aria-label="API key"
        />
      ) : null}

      {busy ? <p className="mt-3 text-sm text-zinc-400">{t("Menjawab…", "Answering…")}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {result ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm leading-relaxed text-zinc-100">{result.answer.text}</p>
          {result.answer.citations.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {result.answer.citations.map((c) => (
                <li key={c} className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] tabular-nums text-zinc-400">
                  {c}
                </li>
              ))}
            </ul>
          ) : null}
          {result.llm ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                {result.llm.provider} · {result.retrieval}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">{result.llm.text}</p>
            </div>
          ) : null}
          {result.quotaNote ? <p className="text-xs text-amber-300">{result.quotaNote}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
