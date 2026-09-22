import { getNoteRepo } from "@/lib/note/repo";
import { JOURNAL_ACCOUNTS_BLOB, resolveAccount, type JournalAccount } from "@/lib/note/accounts";
import { JOURNAL_DEFAULTS_BLOB, normalizeDefaults } from "@/lib/note/defaults";
import { buildPositionCycles } from "@/lib/note/position/cycle";
import { cyclesToEntries } from "@/lib/note/position/adapter";
import { IMPORT_HASHES_BLOB, IMPORT_HASHES_CAP, dedupFills, mergeHashes } from "@/lib/note/statements/dedup";
import { fetchBinanceFills } from "./binance";
import { keyHint, sealCredentials, unsealCredentials } from "./crypto";
import { fetchIbkrFlexFills } from "./ibkr-flex";
import type {
  BinanceCredentials,
  IbkrFlexCredentials,
  SyncAccountPublic,
  SyncAccountStored,
  SyncBroker,
  SyncRunSummary,
} from "./types";

export const SYNC_ACCOUNTS_BLOB = "sync-accounts";

function cuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadAccounts(apexUserId: string): Promise<SyncAccountStored[]> {
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, SYNC_ACCOUNTS_BLOB)) as unknown;
  return Array.isArray(raw) ? (raw as SyncAccountStored[]) : [];
}

async function saveAccounts(apexUserId: string, accounts: SyncAccountStored[]): Promise<void> {
  const repo = getNoteRepo();
  await repo.setUserBlob(apexUserId, SYNC_ACCOUNTS_BLOB, accounts);
}

async function loadJournalAccounts(apexUserId: string): Promise<JournalAccount[]> {
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, JOURNAL_ACCOUNTS_BLOB)) as unknown;
  return Array.isArray(raw) ? (raw as JournalAccount[]) : [];
}

async function resolveEngineOpts(apexUserId: string, label: string) {
  const repo = getNoteRepo();
  const resolved = resolveAccount(await loadJournalAccounts(apexUserId), label);
  const defaults = normalizeDefaults(await repo.getUserBlob(apexUserId, JOURNAL_DEFAULTS_BLOB));
  return { method: resolved.method, pointValues: { ...defaults.multipliers, ...resolved.pointValues } };
}

export async function listSyncAccounts(apexUserId: string): Promise<SyncAccountPublic[]> {
  const accounts = await loadAccounts(apexUserId);
  return accounts.map((a) => {
    const creds = unsealCredentials<Record<string, string>>(a.sealed) ?? {};
    const firstKey = creds.apiKey ?? creds.token ?? "";
    return {
      id: a.id,
      broker: a.broker,
      label: a.label,
      keyHint: keyHint(firstKey),
      symbols: a.symbols,
      lastSyncAt: a.lastSyncAt,
    };
  });
}

export async function saveSyncAccount(
  apexUserId: string,
  input: { broker: SyncBroker; label: string; credentials: Record<string, string>; symbols: string[] },
): Promise<SyncAccountPublic> {
  const accounts = await loadAccounts(apexUserId);
  const label = input.label.trim().slice(0, 40) || input.broker;
  const symbols = [...new Set(input.symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 20);
  const stored: SyncAccountStored = {
    id: cuid(),
    broker: input.broker,
    label,
    sealed: sealCredentials(input.credentials),
    symbols,
    lastSyncAt: null,
    createdAt: new Date().toISOString(),
  };
  accounts.push(stored);
  await saveAccounts(apexUserId, accounts);
  const firstKey = input.credentials.apiKey ?? input.credentials.token ?? "";
  return { id: stored.id, broker: stored.broker, label, keyHint: keyHint(firstKey), symbols, lastSyncAt: null };
}

export async function deleteSyncAccount(apexUserId: string, id: string): Promise<boolean> {
  const accounts = await loadAccounts(apexUserId);
  const next = accounts.filter((a) => a.id !== id);
  if (next.length === accounts.length) return false;
  await saveAccounts(apexUserId, next);
  return true;
}

export async function runSyncAccount(apexUserId: string, id: string): Promise<SyncRunSummary> {
  const accounts = await loadAccounts(apexUserId);
  const account = accounts.find((a) => a.id === id);
  if (!account) {
    return { accountId: id, broker: "binance", fillsFetched: 0, fillsUsable: 0, skipped: 0, cycles: 0, imported: 0, varianceFlags: 0, errors: ["Sync account not found."] };
  }
  const errors: string[] = [];
  let fetched = { fills: [] as Parameters<typeof buildPositionCycles>[0], skipped: 0, errors: [] as string[] };

  if (account.broker === "binance") {
    const creds = unsealCredentials<BinanceCredentials>(account.sealed);
    if (!creds?.apiKey || !creds?.apiSecret) {
      return { accountId: id, broker: account.broker, fillsFetched: 0, fillsUsable: 0, skipped: 0, cycles: 0, imported: 0, varianceFlags: 0, errors: ["Stored credentials are unreadable. Re-add this account."] };
    }
    fetched = await fetchBinanceFills(creds, account.symbols, account.label);
  } else {
    const creds = unsealCredentials<IbkrFlexCredentials>(account.sealed);
    if (!creds?.token || !creds?.queryId) {
      return { accountId: id, broker: account.broker, fillsFetched: 0, fillsUsable: 0, skipped: 0, cycles: 0, imported: 0, varianceFlags: 0, errors: ["Stored credentials are unreadable. Re-add this account."] };
    }
    fetched = await fetchIbkrFlexFills(creds, account.label);
  }
  errors.push(...fetched.errors);

  if (fetched.fills.length === 0) {
    return { accountId: id, broker: account.broker, fillsFetched: 0, fillsUsable: 0, skipped: fetched.skipped, cycles: 0, imported: 0, varianceFlags: 0, errors };
  }

  // Cross-run dedup: re-syncing the same window is a no-op for known fills.
  const repo = getNoteRepo();
  const knownRaw = (await repo.getUserBlob(apexUserId, IMPORT_HASHES_BLOB)) as unknown;
  const known = new Set(Array.isArray(knownRaw) ? (knownRaw as string[]) : []);
  const { fresh, dupes } = dedupFills(fetched.fills, known);
  if (dupes > 0) errors.push(`${dupes} fill sudah pernah diimpor — dilewati.`);
  if (fresh.length === 0) {
    return { accountId: id, broker: account.broker, fillsFetched: fetched.fills.length, fillsUsable: 0, skipped: fetched.skipped, cycles: 0, imported: 0, varianceFlags: 0, errors };
  }

  const cycles = buildPositionCycles(fresh, await resolveEngineOpts(apexUserId, account.label));
  const inputs = cyclesToEntries(cycles, { accountLabel: account.label });
  const defaults = normalizeDefaults(await repo.getUserBlob(apexUserId, JOURNAL_DEFAULTS_BLOB));
  let imported = 0;
  for (const input of inputs) {
    try {
      await repo.createEntry(apexUserId, input, { breakevenBand: defaults.breakevenBand });
      imported += 1;
    } catch {
      errors.push("One cycle failed to save; the rest imported.");
      break;
    }
  }
  await repo.setUserBlob(apexUserId, IMPORT_HASHES_BLOB, mergeHashes([...known], fresh).slice(-IMPORT_HASHES_CAP));

  account.lastSyncAt = new Date().toISOString();
  await saveAccounts(apexUserId, accounts);

  return {
    accountId: id,
    broker: account.broker,
    fillsFetched: fetched.fills.length,
    fillsUsable: fresh.length,
    skipped: fetched.skipped,
    cycles: cycles.length,
    imported,
    varianceFlags: cycles.filter((c) => Math.abs(c.grossVariance) >= 0.01).length,
    errors,
  };
}
