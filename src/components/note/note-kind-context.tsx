"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { KindFilter } from "@/lib/note/stats";

type KindContextValue = {
  kind: KindFilter;
  setKind: (kind: KindFilter) => void;
};

const KindContext = createContext<KindContextValue | null>(null);

export function NoteKindProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<KindFilter>("ALL");
  const value = useMemo(() => ({ kind, setKind }), [kind]);
  return <KindContext.Provider value={value}>{children}</KindContext.Provider>;
}

export function useNoteKind() {
  const ctx = useContext(KindContext);
  if (!ctx) {
    throw new Error("useNoteKind must be used within NoteKindProvider");
  }
  return ctx;
}
