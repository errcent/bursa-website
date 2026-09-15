"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  addPortfolio,
  addTransaction,
  saveTrackStoreLocal,
  txnsForScope,
  newTransactionId,
} from "@/lib/note/track/client-store";
import { loadTrackWithSync, pushTrackToServer } from "@/lib/note/track/sync-client";
import { parseTrackDateTime } from "@/lib/note/track/datetime";
import type { TrackQuoteCurrency, TrackStore, TrackTransaction, TrackTxType } from "@/lib/note/track/types";

type TrackContextValue = {
  store: TrackStore;
  demo: boolean;
  openAccess: boolean;
  scope: "all" | string;
  setScope: (scope: "all" | string) => void;
  createPortfolio: (name: string) => void;
  addTx: (input: AddTxInput) => { ok: true } | { ok: false; error: string };
  loading: boolean;
};

export type AddTxInput = {
  portfolioId: string;
  type: TrackTxType;
  symbol: string;
  quantity: number;
  unitPrice: number | null;
  quoteCurrency: TrackQuoteCurrency;
  fee: number;
  note: string;
  dateDdMmYy: string;
  hour12: number;
  ampm: "AM" | "PM";
};

const TrackContext = createContext<TrackContextValue | null>(null);

export function NoteTrackProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<TrackStore>(() => ({ version: 1, portfolios: [], transactions: [] }));
  const [demo, setDemo] = useState(false);
  const [openAccess, setOpenAccess] = useState(true);
  const [scope, setScope] = useState<"all" | string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTrackWithSync().then((result) => {
      setStore(result.store);
      setDemo(result.demo);
      setOpenAccess(result.openAccess);
      setLoading(false);
    });
  }, []);

  const persist = useCallback((next: TrackStore) => {
    setStore(next);
    saveTrackStoreLocal(next);
    setDemo(false);
    void pushTrackToServer(next);
  }, []);

  const createPortfolio = useCallback(
    (name: string) => {
      if (!name.trim()) return;
      const next = addPortfolio(store, name);
      persist(next);
      const created = next.portfolios.at(-1);
      if (created) setScope(created.id);
    },
    [store, persist]
  );

  const addTx = useCallback(
    (input: AddTxInput): { ok: true } | { ok: false; error: string } => {
      const iso = parseTrackDateTime(input.dateDdMmYy, input.hour12, input.ampm);
      if (!iso) return { ok: false, error: "invalid_datetime" };
      if (!input.symbol.trim()) return { ok: false, error: "symbol" };
      if (input.quantity <= 0) return { ok: false, error: "quantity" };
      if ((input.type === "buy" || input.type === "sell") && (input.unitPrice == null || input.unitPrice < 0)) {
        return { ok: false, error: "price" };
      }
      const tx: TrackTransaction = {
        id: newTransactionId(),
        portfolioId: input.portfolioId,
        type: input.type,
        symbol: input.symbol.trim().toUpperCase(),
        quantity: input.quantity,
        unitPrice: input.type === "transfer_in" ? input.unitPrice : input.unitPrice,
        quoteCurrency: input.quoteCurrency,
        fee: input.fee || 0,
        note: input.note.trim() || null,
        executedAt: iso,
        createdAt: new Date().toISOString(),
      };
      persist(addTransaction(store, tx));
      return { ok: true };
    },
    [store, persist]
  );

  const value = useMemo(
    () => ({
      store,
      demo,
      openAccess,
      scope,
      setScope,
      createPortfolio,
      addTx,
      loading,
    }),
    [store, demo, openAccess, scope, createPortfolio, addTx, loading]
  );

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

export function useNoteTrack() {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error("useNoteTrack outside provider");
  return ctx;
}

export function useScopedTransactions() {
  const { store, scope } = useNoteTrack();
  return useMemo(() => txnsForScope(store, scope), [store, scope]);
}
