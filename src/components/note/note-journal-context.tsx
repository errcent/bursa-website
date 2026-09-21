"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useNoteJournalDb } from "@/components/note/note-journal-db-context";
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

function NoteJournalProviderInner({ children }: { children: ReactNode }) {
  const db = useNoteJournalDb();
  const [apiState, setApiState] = useState<JournalState>({
    data: null,
    demo: false,
    openAccess: isNoteOpenAccessPeriod(),
    error: null,
    loading: true,
  });
  const useLocalDb = isLocalHost() || isNoteOpenAccessPeriod();

  useEffect(() => {
    if (useLocalDb) return;
    let cancelled = false;
    void fetch(`/api/note/entries?limit=5000&_=${Date.now()}`, { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = noteSsoStartHref("/note");
          return null;
        }
        if (!res.ok) throw new Error("Gagal memuat jurnal.");
        return (await res.json()) as Payload;
      })
      .then((payload) => {
        if (cancelled || !payload) return;
        setApiState({
          data: payload,
          demo: Boolean(payload.demo),
          openAccess: Boolean(payload.openAccess ?? isNoteOpenAccessPeriod()),
          error: null,
          loading: false,
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setApiState({
            data: null,
            demo: false,
            openAccess: isNoteOpenAccessPeriod(),
            error: err.message,
            loading: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [useLocalDb]);

  const state = useMemo<JournalState>(() => {
    if (useLocalDb) {
      return {
        data: {
          entries: db.projectedEntries,
          plus: false,
          reviewCountThisWeek: 1,
          demo: true,
          openAccess: isNoteOpenAccessPeriod(),
        },
        demo: true,
        openAccess: isNoteOpenAccessPeriod(),
        error: db.error,
        loading: !db.ready,
      };
    }
    return apiState;
  }, [useLocalDb, db.projectedEntries, db.error, db.ready, apiState]);

  return <JournalContext.Provider value={state}>{children}</JournalContext.Provider>;
}

export function NoteJournalProvider({ children }: { children: ReactNode }) {
  return <NoteJournalProviderInner>{children}</NoteJournalProviderInner>;
}

export function useNoteJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error("useNoteJournal must be used within NoteJournalProvider");
  }
  return ctx;
}
