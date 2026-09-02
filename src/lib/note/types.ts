export type JournalKind = "TRADE" | "INVEST";
export type JournalMode = "cepat" | "review" | "klinik";
export type JournalResult = "win" | "loss" | "be" | "open";

export const JOURNAL_MODES: JournalMode[] = ["cepat", "review", "klinik"];
export const JOURNAL_KINDS: JournalKind[] = ["TRADE", "INVEST"];

export type NoteScope = "note.read" | "note.write" | "note.sync";

export interface JournalEntry {
  id: string;
  apexUserId: string;
  kind: JournalKind;
  mode: JournalMode;
  symbol: string;
  side: string;
  qty: number | null;
  entryPrice: number | null;
  exitPrice: number | null;
  fees: number | null;
  pnl: number | null;
  result: JournalResult | null;
  emotion: string | null;
  note: string | null;
  ruleBroken: string | null;
  lesson: string | null;
  clinicModuleId: string | null;
  protocol: string | null;
  accountLabel: string | null;
  openedAt: string;
  createdAt: string;
}

export interface NoteEntitlement {
  apexUserId: string;
  plus: boolean;
}

export interface CreateEntryInput {
  kind: JournalKind;
  mode: JournalMode;
  symbol: string;
  side: string;
  qty?: number | null;
  entryPrice?: number | null;
  exitPrice?: number | null;
  fees?: number | null;
  pnl?: number | null;
  result?: JournalResult | null;
  emotion?: string | null;
  note?: string | null;
  ruleBroken?: string | null;
  lesson?: string | null;
  clinicModuleId?: string | null;
  protocol?: string | null;
  accountLabel?: string | null;
  openedAt?: string | null;
}

export interface NoteSession {
  userId: string;
  email: string;
  scopes: NoteScope[];
}
