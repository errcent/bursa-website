import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NOTE_JOURNAL_ACCOUNT_MAX, NOTE_JOURNAL_LIST_MAX } from "@/lib/note/resource-limits";
import type { CreateEntryInput, JournalEntry, NoteEntitlement, UpdateEntryInput } from "@/lib/note/types";
import type { JournalDbSchema } from "@/lib/note/journal-db/types";
import { buildJournalEntry } from "@/lib/note/build-entry";
import {
  compareJournalEntriesDesc,
  encodeJournalPageCursor,
  journalEntryAfterPageCursor,
  parseJournalPageCursor,
} from "@/lib/note/journal-page-cursor";
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
  schemas?: Record<string, JournalDbSchema>;
}

export type JournalListPage = {
  entries: JournalEntry[];
  nextCursor: string | null;
};

export interface NoteRepository {
  getEntitlement(apexUserId: string): Promise<NoteEntitlement>;
  setPlus(apexUserId: string, plus: boolean): Promise<void>;
  listEntries(apexUserId: string): Promise<JournalEntry[]>;
  listEntriesPage(
    apexUserId: string,
    opts: { limit: number; cursor?: string | null }
  ): Promise<JournalListPage>;
  createEntry(apexUserId: string, input: CreateEntryInput): Promise<JournalEntry>;
  updateEntry(apexUserId: string, id: string, input: UpdateEntryInput): Promise<JournalEntry | null>;
  deleteEntry(apexUserId: string, id: string): Promise<boolean>;
  getJournalSchema(apexUserId: string): Promise<JournalDbSchema | null>;
  upsertJournalSchema(apexUserId: string, schema: JournalDbSchema): Promise<JournalDbSchema>;
  saveSsoCode(record: SsoRecord): Promise<void>;
  consumeSsoCode(code: string): Promise<SsoRecord | null>;
}

const EMPTY: NoteStoreFile = { entitlements: [], entries: [], ssoCodes: [], schemas: {} };

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
      schemas: parsed.schemas ?? {},
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
    const page = await fileRepo.listEntriesPage(apexUserId, { limit: NOTE_JOURNAL_LIST_MAX });
    return page.entries;
  },
  async listEntriesPage(apexUserId, { limit, cursor }) {
    const store = await readStore();
    const cap = Math.min(Math.max(limit, 1), NOTE_JOURNAL_LIST_MAX);
    let rows = store.entries
      .filter((e) => e.apexUserId === apexUserId)
      .sort(compareJournalEntriesDesc);
    if (cursor) {
      const parsed = parseJournalPageCursor(cursor);
      rows = rows.filter((e) =>
        parsed.id
          ? journalEntryAfterPageCursor(e, parsed)
          : e.createdAt < parsed.createdAt
      );
    }
    const hasMore = rows.length > cap;
    const slice = hasMore ? rows.slice(0, cap) : rows;
    const tail = slice[slice.length - 1];
    return {
      entries: slice,
      nextCursor: hasMore && tail ? encodeJournalPageCursor(tail) : null,
    };
  },
  async createEntry(apexUserId, input) {
    const store = await readStore();
    const count = store.entries.filter((e) => e.apexUserId === apexUserId).length;
    if (count >= NOTE_JOURNAL_ACCOUNT_MAX) {
      throw new Error("NOTE_JOURNAL_CAP");
    }
    const entry = buildJournalEntry(apexUserId, input);
    if (input.properties) entry.properties = input.properties;
    store.entries.push(entry);
    await writeStore(store);
    return entry;
  },
  async updateEntry(apexUserId, id, input) {
    const store = await readStore();
    const idx = store.entries.findIndex((e) => e.id === id && e.apexUserId === apexUserId);
    if (idx < 0) return null;
    const prev = store.entries[idx]!;
    const merged = buildJournalEntry(apexUserId, {
      kind: input.kind ?? prev.kind,
      mode: input.mode ?? prev.mode,
      symbol: input.symbol ?? prev.symbol,
      side: input.side ?? prev.side,
      qty: input.qty !== undefined ? input.qty : prev.qty,
      entryPrice: input.entryPrice !== undefined ? input.entryPrice : prev.entryPrice,
      exitPrice: input.exitPrice !== undefined ? input.exitPrice : prev.exitPrice,
      fees: input.fees !== undefined ? input.fees : prev.fees,
      pnl: input.pnl !== undefined ? input.pnl : prev.pnl,
      result: input.result !== undefined ? input.result : prev.result,
      emotion: input.emotion !== undefined ? input.emotion : prev.emotion,
      note: input.note !== undefined ? input.note : prev.note,
      ruleBroken: input.ruleBroken !== undefined ? input.ruleBroken : prev.ruleBroken,
      lesson: input.lesson !== undefined ? input.lesson : prev.lesson,
      clinicModuleId: input.clinicModuleId !== undefined ? input.clinicModuleId : prev.clinicModuleId,
      protocol: input.protocol !== undefined ? input.protocol : prev.protocol,
      accountLabel: input.accountLabel !== undefined ? input.accountLabel : prev.accountLabel,
      relatedCourseSlug:
        input.relatedCourseSlug !== undefined ? input.relatedCourseSlug : prev.relatedCourseSlug,
      relatedLessonId: input.relatedLessonId !== undefined ? input.relatedLessonId : prev.relatedLessonId,
      openedAt: input.openedAt !== undefined ? input.openedAt : prev.openedAt,
      properties: input.properties !== undefined ? input.properties : prev.properties,
    });
    const next: JournalEntry = {
      ...merged,
      id: prev.id,
      createdAt: prev.createdAt,
      properties: input.properties !== undefined ? input.properties : prev.properties,
      updatedAt: new Date().toISOString(),
    };
    store.entries[idx] = next;
    await writeStore(store);
    return next;
  },
  async deleteEntry(apexUserId, id) {
    const store = await readStore();
    const before = store.entries.length;
    store.entries = store.entries.filter((e) => !(e.id === id && e.apexUserId === apexUserId));
    if (store.entries.length === before) return false;
    await writeStore(store);
    return true;
  },
  async getJournalSchema(apexUserId) {
    const store = await readStore();
    return store.schemas?.[apexUserId] ?? null;
  },
  async upsertJournalSchema(apexUserId, schema) {
    const store = await readStore();
    store.schemas = store.schemas ?? {};
    store.schemas[apexUserId] = schema;
    await writeStore(store);
    return schema;
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
    const page = await memoryRepo.listEntriesPage(apexUserId, { limit: NOTE_JOURNAL_LIST_MAX });
    return page.entries;
  },
  async listEntriesPage(apexUserId, { limit, cursor }) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [] };
    const cap = Math.min(Math.max(limit, 1), NOTE_JOURNAL_LIST_MAX);
    let rows = memory.entries
      .filter((e) => e.apexUserId === apexUserId)
      .sort(compareJournalEntriesDesc);
    if (cursor) {
      const parsed = parseJournalPageCursor(cursor);
      rows = rows.filter((e) =>
        parsed.id
          ? journalEntryAfterPageCursor(e, parsed)
          : e.createdAt < parsed.createdAt
      );
    }
    const hasMore = rows.length > cap;
    const slice = hasMore ? rows.slice(0, cap) : rows;
    const tail = slice[slice.length - 1];
    return {
      entries: slice,
      nextCursor: hasMore && tail ? encodeJournalPageCursor(tail) : null,
    };
  },
  async createEntry(apexUserId, input) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
    const count = memory.entries.filter((e) => e.apexUserId === apexUserId).length;
    if (count >= NOTE_JOURNAL_ACCOUNT_MAX) {
      throw new Error("NOTE_JOURNAL_CAP");
    }
    const entry = buildJournalEntry(apexUserId, input);
    if (input.properties) entry.properties = input.properties;
    memory.entries.push(entry);
    return entry;
  },
  async updateEntry(apexUserId, id, input) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
    const idx = memory.entries.findIndex((e) => e.id === id && e.apexUserId === apexUserId);
    if (idx < 0) return null;
    const prev = memory.entries[idx]!;
    const patched = await (async () => {
      const merged = buildJournalEntry(apexUserId, {
        kind: input.kind ?? prev.kind,
        mode: input.mode ?? prev.mode,
        symbol: input.symbol ?? prev.symbol,
        side: input.side ?? prev.side,
        qty: input.qty !== undefined ? input.qty : prev.qty,
        entryPrice: input.entryPrice !== undefined ? input.entryPrice : prev.entryPrice,
        exitPrice: input.exitPrice !== undefined ? input.exitPrice : prev.exitPrice,
        fees: input.fees !== undefined ? input.fees : prev.fees,
        pnl: input.pnl !== undefined ? input.pnl : prev.pnl,
        result: input.result !== undefined ? input.result : prev.result,
        emotion: input.emotion !== undefined ? input.emotion : prev.emotion,
        note: input.note !== undefined ? input.note : prev.note,
        ruleBroken: input.ruleBroken !== undefined ? input.ruleBroken : prev.ruleBroken,
        lesson: input.lesson !== undefined ? input.lesson : prev.lesson,
        clinicModuleId: input.clinicModuleId !== undefined ? input.clinicModuleId : prev.clinicModuleId,
        protocol: input.protocol !== undefined ? input.protocol : prev.protocol,
        accountLabel: input.accountLabel !== undefined ? input.accountLabel : prev.accountLabel,
        relatedCourseSlug:
          input.relatedCourseSlug !== undefined ? input.relatedCourseSlug : prev.relatedCourseSlug,
        relatedLessonId: input.relatedLessonId !== undefined ? input.relatedLessonId : prev.relatedLessonId,
        openedAt: input.openedAt !== undefined ? input.openedAt : prev.openedAt,
        properties: input.properties !== undefined ? input.properties : prev.properties,
      });
      return {
        ...merged,
        id: prev.id,
        createdAt: prev.createdAt,
        properties: input.properties !== undefined ? input.properties : prev.properties,
        updatedAt: new Date().toISOString(),
      } satisfies JournalEntry;
    })();
    memory.entries[idx] = patched;
    return patched;
  },
  async deleteEntry(apexUserId, id) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
    const before = memory.entries.length;
    memory.entries = memory.entries.filter((e) => !(e.id === id && e.apexUserId === apexUserId));
    return memory.entries.length < before;
  },
  async getJournalSchema(apexUserId) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
    return memory.schemas?.[apexUserId] ?? null;
  },
  async upsertJournalSchema(apexUserId, schema) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
    memory.schemas = memory.schemas ?? {};
    memory.schemas[apexUserId] = schema;
    return schema;
  },
  async saveSsoCode(record) {
    memory ??= { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
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
  memory = { entitlements: [], entries: [], ssoCodes: [], schemas: {} };
}

export { buildJournalEntry };
