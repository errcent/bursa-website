/**
 * Broker sync domain (BYOK, read-only).
 *
 * Users paste their OWN read-only API keys. Keys are encrypted server-side
 * with an env-separated secret (never a file beside the database) and are
 * never returned to any client. Sync only reads trade history; it can never
 * place orders, withdraw, or change broker settings.
 */

import type { Fill } from "@/lib/note/position/types";

export type SyncBroker = "binance" | "ibkr-flex";

export interface SyncAccountStored {
  id: string;
  broker: SyncBroker;
  label: string;
  /** Encrypted JSON credential envelope (opaque to clients). */
  sealed: string;
  /** User-supplied symbols to sync (Binance requires per-symbol history). */
  symbols: string[];
  lastSyncAt: string | null;
  createdAt: string;
}

export interface SyncAccountPublic {
  id: string;
  broker: SyncBroker;
  label: string;
  keyHint: string;
  symbols: string[];
  lastSyncAt: string | null;
}

export interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface IbkrFlexCredentials {
  token: string;
  queryId: string;
}

export interface SyncRunSummary {
  accountId: string;
  broker: SyncBroker;
  fillsFetched: number;
  fillsUsable: number;
  skipped: number;
  cycles: number;
  imported: number;
  varianceFlags: number;
  errors: string[];
}

export interface BrokerFetchResult {
  fills: Fill[];
  skipped: number;
  errors: string[];
}
