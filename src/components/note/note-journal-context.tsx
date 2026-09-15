"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { NOTE_DEMO_ENTRIES, withDemoJournalFallback } from "@/lib/note/demo-entries";
import { isNoteOpenAccessPeriod } from "@/lib/note/open-access";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import type { JournalEntry } from "@/lib/note/types";

type Payload = {
  entries: JournalEntry[];
  plus: boolean;
  reviewCountThisWeek: number;
  demo?: boolean;
  openAccess?: boolean;
};

type JournalState = {
  data: Payload | null;
  demo: boolean;
  openAccess: boolean;
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
    openAccess: isNoteOpenAccessPeriod(),
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/note/entries?limit=5000&_=${Date.now()}`, { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          if (isLocalHost() || isNoteOpenAccessPeriod()) {
            return {
              demo: true,
              payload: {
                entries: NOTE_DEMO_ENTRIES,
                plus: false,
                reviewCountThisWeek: 1,
                demo: true,
                openAccess: isNoteOpenAccessPeriod(),
              } satisfies Payload,
            };
          }
          window.location.href = noteSsoStartHref("/note");
          return null;
        }
        if (!res.ok) throw new Error("Gagal memuat jurnal.");
        let payload = (await res.json()) as Payload;
        const merged = withDemoJournalFallback(payload.entries);
        if (merged.demo) {
          payload = {
            ...payload,
            entries: merged.entries,
            demo: true,
          };
        }
        return { demo: Boolean(payload.demo), payload };
      })
      .then((next) => {
        if (cancelled || !next) return;
        setState({
          data: next.payload,
          demo: next.demo,
          openAccess: Boolean(next.payload.openAccess ?? isNoteOpenAccessPeriod()),
          error: null,
          loading: false,
        });
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
