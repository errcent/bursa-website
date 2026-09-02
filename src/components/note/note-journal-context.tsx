"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { NOTE_DEMO_ENTRIES } from "@/lib/note/demo-entries";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import type { JournalEntry } from "@/lib/note/types";

type Payload = {
  entries: JournalEntry[];
  plus: boolean;
  reviewCountThisWeek: number;
};

type JournalState = {
  data: Payload | null;
  demo: boolean;
  error: string | null;
  loading: boolean;
};

const JournalContext = createContext<JournalState | null>(null);

function isLocalHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export function NoteJournalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JournalState>({
    data: null,
    demo: false,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/note/entries", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          if (isLocalHost()) {
            return {
              demo: true,
              payload: { entries: NOTE_DEMO_ENTRIES, plus: false, reviewCountThisWeek: 1 } satisfies Payload,
            };
          }
          window.location.href = noteSsoStartHref("/note");
          return null;
        }
        if (!res.ok) throw new Error("Gagal memuat jurnal.");
        return { demo: false, payload: (await res.json()) as Payload };
      })
      .then((next) => {
        if (cancelled || !next) return;
        setState({ data: next.payload, demo: next.demo, error: null, loading: false });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, demo: false, error: err.message, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <JournalContext.Provider value={state}>{children}</JournalContext.Provider>;
}

export function useNoteJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error("useNoteJournal must be used within NoteJournalProvider");
  }
  return ctx;
}
