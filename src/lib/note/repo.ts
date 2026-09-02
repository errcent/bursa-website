import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CreateEntryInput, JournalEntry, NoteEntitlement } from "@/lib/note/types";
import { buildJournalEntry } from "@/lib/note/build-entry";
import { postgresRepo } from "@/lib/note/postgres-repo";

export interface SsoRecord {
  code: string;
  apexUserId: string;
  email: string;
  expiresAt: number;
}

interface NoteStoreFile {
  entitlements: NoteEntitlement[];
  entries: JournalEntry[];
  ssoCodes: SsoRecord[];
}

export interface NoteRepository {
  getEntitlement(apexUserId: string): Promise<NoteEntitlement>;
  setPlus(apexUserId: string, plus: boolean): Promise<void>;
  listEntries(apexUserId: string): Promise<JournalEntry[]>;
  createEntry(apexUserId: string, input: CreateEntryInput): Promise<JournalEntry>;
  saveSsoCode(record: SsoRecord): Promise<void>;
  consumeSsoCode(code: string): Promise<SsoRecord | null>;
}

const EMPTY: NoteStoreFile = { entitlements: [], entries: [], ssoCodes: [] };

function storePath() {
  return path.join(process.cwd(), ".data", "note-local.json");
}

async function readStore(): Promise<NoteStoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as NoteStoreFile;
    return {
      entitlements: parsed.entitlements ?? [],
      entries: parsed.entries ?? [],
      ssoCodes: parsed.ssoCodes ?? [],
    };
  } catch {
    return { ...EMPTY, entitlements: [], entries: [], ssoCodes: [] };
  }
}

async function writeStore(store: NoteStoreFile) {
  const dir = path.dirname(storePath());
  await mkdir(dir, { recursive: true });
  await writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
}

function assertNotProductionFileStore() {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    if (!process.env.NOTE_DATABASE_URL) {
      throw new Error("NOTE_DATABASE_URL wajib di production. File store dilarang.");
    }
  }
}

const fileRepo: NoteRepository = {
  async getEntitlement(apexUserId) {
    const store = await readStore();
    return store.entitlements.find((e) => e.apexUserId === apexUserId) ?? { apexUserId, plus: false };
  },
  async setPlus(apexUserId, plus) {
    const store = await readStore();
    const next = store.entitlements.filter((e) => e.apexUserId !== apexUserId);
    next.push({ apexUserId, plus });
    store.entitlements = next;
    await writeStore(store);
  },
  async listEntries(apexUserId) {
    const store = await readStore();
    return store.entries
      .filter((e) => e.apexUserId === apexUserId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async createEntry(apexUserId, input) {
    const store = await readStore();
    const entry = buildJournalEntry(apexUserId, input);
    store.entries.push(entry);
    await writeStore(store);
    return entry;
  },
  async saveSsoCode(record) {
    const store = await readStore();
    const now = Date.now();
    store.ssoCodes = store.ssoCodes.filter((c) => c.expiresAt > now && c.code !== record.code);
    store.ssoCodes.push(record);
    await writeStore(store);
  },
  async consumeSsoCode(code) {
    const store = await readStore();
    const now = Date.now();
    const found = store.ssoCodes.find((c) => c.code === code);
    store.ssoCodes = store.ssoCodes.filter((c) => c.code !== code && c.expiresAt > now);
    await writeStore(store);
    if (!found || found.expiresAt <= now) return null;
    return found;
  },
};

let memory: NoteStoreFile | null = null;

const memoryRepo: NoteRepository = {
  async getEntitlement(apexUserId) {
    memory ??= { ...EMPTY, entitlements: [], entries: [], ssoCodes: [] };
    return memory.entitlements.find((e) => e.apexUserId === apexUserId) ?? { apexUserId, plus: false };
  },
  async setPlus(apexUserId, plus) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [] };
    memory.entitlements = memory.entitlements.filter((e) => e.apexUserId !== apexUserId);
    memory.entitlements.push({ apexUserId, plus });
  },
  async listEntries(apexUserId) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [] };
    return memory.entries
      .filter((e) => e.apexUserId === apexUserId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async createEntry(apexUserId, input) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [] };
    const entry = buildJournalEntry(apexUserId, input);
    memory.entries.push(entry);
    return entry;
  },
  async saveSsoCode(record) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [] };
    memory.ssoCodes = memory.ssoCodes.filter((c) => c.expiresAt > Date.now() && c.code !== record.code);
    memory.ssoCodes.push(record);
  },
  async consumeSsoCode(code) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [] };
    const found = memory.ssoCodes.find((c) => c.code === code);
    memory.ssoCodes = memory.ssoCodes.filter((c) => c.code !== code && c.expiresAt > Date.now());
    if (!found || found.expiresAt <= Date.now()) return null;
    return found;
  },
};

export function getNoteRepo(): NoteRepository {
  if (process.env.NOTE_REPO === "memory" || process.env.VITEST || process.env.NODE_TEST_CONTEXT) {
    return memoryRepo;
  }
  if (process.env.NOTE_DATABASE_URL) {
    return postgresRepo;
  }
  assertNotProductionFileStore();
  return fileRepo;
}

export function resetNoteMemoryRepo() {
  memory = { entitlements: [], entries: [], ssoCodes: [] };
}

export { buildJournalEntry };
