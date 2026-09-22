"use client";

import { useState } from "react";

import { parseTradeLine } from "@/lib/note/parse-trade";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/**
 * Voice log (v3 P2).
 *
 * Tap mic → speak trade → parsed into entry.
 * Uses browser-native Web Speech API (SpeechRecognition).
 * $0 cost, no cloud, no API key.
 *
 * Example: "Bought EURUSD at 1.0850, stop 1.0820, target 1.0920"
 * → parsed into BUY EURUSD @1.0850 SL 1.0820 TP 1.0920
 */

// Minimal type for SpeechRecognition (not in standard TS lib)
interface SpeechRecognitionResult {
  transcript: string;
}
interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
  resultIndex: number;
}
interface SpeechRecognition {
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
}

function getSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const SR =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

/** Normalize spoken trade to parser format. */
function normalizeSpeech(text: string): string {
  let s = text.trim();
  // "bought" → "BUY", "sold" → "SELL"
  s = s.replace(/\bbought\b/i, "BUY").replace(/\bsold\b/i, "SELL");
  // "at" → "@"
  s = s.replace(/\bat\b/i, "@");
  // "stop" → "SL", "target" → "TP"
  s = s.replace(/\bstop\b/gi, "SL").replace(/\btarget\b/gi, "TP");
  // "feeling confident" → strip (emotion handled separately)
  s = s.replace(/feeling.*$/i, "").trim();
  return s;
}

interface Props {
  onParsed: (text: string) => void;
}

export function VoiceLogButton({ onParsed }: Props) {
  const [prefs] = useNotePrefs();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => getSpeechRecognition() !== null);

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  function startListening() {
    const rec = getSpeechRecognition();
    if (!rec) {
      setError(t("Browser tidak mendukung voice.", "Browser doesn't support voice."));
      return;
    }

    setError(null);
    setListening(true);

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const last = e.results[e.results.length - 1];
      if (last) {
        const transcript = last[0].transcript;
        const normalized = normalizeSpeech(transcript);
        onParsed(normalized);
      }
    };
    rec.onerror = () => {
      setError(t("Gagal mendengar.", "Could not hear."));
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };

    rec.start();
  }

  function stopListening() {
    const rec = getSpeechRecognition();
    if (rec) rec.stop();
    setListening(false);
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-xs font-medium",
          listening
            ? "border-rose-700 bg-rose-900/40 text-rose-200"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        )}
        aria-label={listening ? t("Berhenti", "Stop") : t("Log suara", "Voice log")}
      >
        {listening ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-rose-400" />
            {t("Mendengar...", "Listening...")}
          </>
        ) : (
          <>
            <span className="text-sm">🎙</span>
            {t("Log suara", "Voice log")}
          </>
        )}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
