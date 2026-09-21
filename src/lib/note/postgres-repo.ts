import { getNotePrisma } from "@/lib/note/db";
import { NOTE_JOURNAL_ACCOUNT_MAX, NOTE_JOURNAL_LIST_MAX } from "@/lib/note/resource-limits";
import type { CreateEntryInput, JournalEntry, UpdateEntryInput } from "@/lib/note/types";
import { buildJournalEntry } from "@/lib/note/build-entry";
import { encodeJournalPageCursor, parseJournalPageCursor } from "@/lib/note/journal-page-cursor";
import type { JournalDbSchema } from "@/lib/note/journal-db/types";
import type { NoteRepository, SsoRecord } from "@/lib/note/repo";

function toIso(value: Date): string {
  return value.toISOString();
}

export const postgresRepo: NoteRepository = {
  async getEntitlement(apexUserId) {
    const db = getNotePrisma();
    const account = await db.noteAccount.findUnique({ where: { apexUserId } });
    return { apexUserId, plus: account?.plus ?? false };
  },

  async setPlus(apexUserId, plus) {
    const db = getNotePrisma();
    await db.noteAccount.upsert({
      where: { apexUserId },
      create: { apexUserId, plus },
      update: { plus },
    });
  },

  async listEntries(apexUserId) {
    const page = await postgresRepo.listEntriesPage(apexUserId, { limit: NOTE_JOURNAL_LIST_MAX });
    return page.entries;
  },

  async listEntriesPage(apexUserId, { limit, cursor }) {
    const db = getNotePrisma();
    const cap = Math.min(Math.max(limit, 1), NOTE_JOURNAL_LIST_MAX);
    const account = await db.noteAccount.findUnique({ where: { apexUserId } });
    if (!account) return { entries: [], nextCursor: null };

    const parsed = cursor ? parseJournalPageCursor(cursor) : null;
    const cursorAt = parsed ? new Date(parsed.createdAt) : null;
    const rows = await db.journalEntry.findMany({
      where: {
        accountId: account.id,
        ...(parsed && cursorAt && !Number.isNaN(cursorAt.getTime())
          ? parsed.id
            ? {
                OR: [
                  { createdAt: { lt: cursorAt } },
                  { createdAt: cursorAt, id: { lt: parsed.id } },
                ],
              }
            : { createdAt: { lt: cursorAt } }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: cap + 1,
    });
    const hasMore = rows.length > cap;
    const slice = hasMore ? rows.slice(0, cap) : rows;
    const entries = slice.map((row) => mapRow(apexUserId, row));
    const tail = slice[slice.length - 1];
    const nextCursor =
      hasMore && tail
        ? encodeJournalPageCursor({ createdAt: tail.createdAt.toISOString(), id: tail.id })
        : null;
    return { entries, nextCursor };
  },

  async createEntry(apexUserId, input: CreateEntryInput) {
    const db = getNotePrisma();
    const account = await db.noteAccount.upsert({
      where: { apexUserId },
      create: { apexUserId, plus: false },
      update: {},
    });
    const entryCount = await db.journalEntry.count({ where: { accountId: account.id } });
    if (entryCount >= NOTE_JOURNAL_ACCOUNT_MAX) {
      throw new Error("NOTE_JOURNAL_CAP");
    }
    const built = buildJournalEntry(apexUserId, input);
    const row = await db.journalEntry.create({
      data: {
        id: built.id,
        accountId: account.id,
        kind: built.kind,
        mode: built.mode,
        symbol: built.symbol,
        side: built.side,
        qty: built.qty,
        entryPrice: built.entryPrice,
        exitPrice: built.exitPrice,
        fees: built.fees,
        pnl: built.pnl,
        result: built.result,
        emotion: built.emotion,
        note: built.note,
        ruleBroken: built.ruleBroken,
        lesson: built.lesson,
        clinicModuleId: built.clinicModuleId,
        protocol: built.protocol,
        accountLabel: built.accountLabel,
        relatedCourseSlug: built.relatedCourseSlug,
        relatedLessonId: built.relatedLessonId,
        openedAt: new Date(built.openedAt),
        createdAt: new Date(built.createdAt),
        ...(input.properties ? { properties: input.properties } : {}),
      } as never,
    });
    return mapRow(apexUserId, row);
  },

  async updateEntry(apexUserId, id, input: UpdateEntryInput) {
    const db = getNotePrisma();
    const account = await db.noteAccount.findUnique({ where: { apexUserId } });
    if (!account) return null;
    const existing = await db.journalEntry.findFirst({ where: { id, accountId: account.id } });
    if (!existing) return null;
    const prev = mapRow(apexUserId, existing);
    const built = buildJournalEntry(apexUserId, {
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
    const row = await db.journalEntry.update({
      where: { id },
      data: {
        kind: built.kind,
        mode: built.mode,
        symbol: built.symbol,
        side: built.side,
        qty: built.qty,
        entryPrice: built.entryPrice,
        exitPrice: built.exitPrice,
        fees: built.fees,
        pnl: built.pnl,
        result: built.result,
        emotion: built.emotion,
        note: built.note,
        ruleBroken: built.ruleBroken,
        lesson: built.lesson,
        clinicModuleId: built.clinicModuleId,
        protocol: built.protocol,
        accountLabel: built.accountLabel,
        relatedCourseSlug: built.relatedCourseSlug,
        relatedLessonId: built.relatedLessonId,
        openedAt: new Date(built.openedAt),
        ...(input.properties !== undefined ? { properties: input.properties } : {}),
      } as never,
    });
    return mapRow(apexUserId, row);
  },

  async deleteEntry(apexUserId, id) {
    const db = getNotePrisma();
    const account = await db.noteAccount.findUnique({ where: { apexUserId } });
    if (!account) return false;
    const result = await db.journalEntry.deleteMany({ where: { id, accountId: account.id } });
    return result.count > 0;
  },

  async getJournalSchema(apexUserId) {
    const db = getNotePrisma() as ReturnType<typeof getNotePrisma> & {
      noteJournalSchema: {
        findUnique: (args: unknown) => Promise<{ schema: unknown } | null>;
        upsert: (args: unknown) => Promise<unknown>;
      };
    };
    const account = await db.noteAccount.findUnique({ where: { apexUserId } });
    if (!account) return null;
    const row = await db.noteJournalSchema.findUnique({ where: { accountId: account.id } });
    return (row?.schema as JournalDbSchema) ?? null;
  },

  async upsertJournalSchema(apexUserId, schema) {
    const db = getNotePrisma() as ReturnType<typeof getNotePrisma> & {
      noteJournalSchema: {
        upsert: (args: unknown) => Promise<unknown>;
      };
    };
    const account = await db.noteAccount.upsert({
      where: { apexUserId },
      create: { apexUserId, plus: false },
      update: {},
    });
    await db.noteJournalSchema.upsert({
      where: { accountId: account.id },
      create: { accountId: account.id, schema },
      update: { schema },
    });
    return schema;
  },

  async saveSsoCode(record: SsoRecord) {
    const db = getNotePrisma();
    const now = new Date();
    await db.noteSsoCode.deleteMany({
      where: { OR: [{ code: record.code }, { expiresAt: { lte: now } }] },
    });
    await db.noteSsoCode.create({
      data: {
        code: record.code,
        apexUserId: record.apexUserId,
        email: record.email,
        expiresAt: new Date(record.expiresAt),
      },
    });
  },

  async consumeSsoCode(code: string) {
    const db = getNotePrisma();
    const found = await db.noteSsoCode.findUnique({ where: { code } });
    await db.noteSsoCode.deleteMany({
      where: { OR: [{ code }, { expiresAt: { lte: new Date() } }] },
    });
    if (!found || found.expiresAt.getTime() <= Date.now()) return null;
    return {
      code: found.code,
      apexUserId: found.apexUserId,
      email: found.email,
      expiresAt: found.expiresAt.getTime(),
    };
  },
};

function mapRow(
  apexUserId: string,
  row: {
    id: string;
    kind: string;
    mode: string;
    symbol: string;
    side: string;
    qty: number | null;
    entryPrice: number | null;
    exitPrice: number | null;
    fees: number | null;
    pnl: number | null;
    result: string | null;
    emotion: string | null;
    note: string | null;
    ruleBroken: string | null;
    lesson: string | null;
    clinicModuleId: string | null;
    protocol: string | null;
    accountLabel: string | null;
    relatedCourseSlug: string | null;
    relatedLessonId: string | null;
    properties?: unknown;
    openedAt: Date;
    createdAt: Date;
    updatedAt?: Date;
  }
): JournalEntry {
  return {
    id: row.id,
    apexUserId,
    kind: row.kind as JournalEntry["kind"],
    mode: row.mode as JournalEntry["mode"],
    symbol: row.symbol,
    side: row.side,
    qty: row.qty,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    fees: row.fees,
    pnl: row.pnl,
    result: row.result as JournalEntry["result"],
    emotion: row.emotion,
    note: row.note,
    ruleBroken: row.ruleBroken,
    lesson: row.lesson,
    clinicModuleId: row.clinicModuleId,
    protocol: row.protocol,
    accountLabel: row.accountLabel,
    relatedCourseSlug: row.relatedCourseSlug ?? null,
    relatedLessonId: row.relatedLessonId ?? null,
    properties:
      row.properties && typeof row.properties === "object"
        ? (row.properties as Record<string, unknown>)
        : null,
    openedAt: toIso(row.openedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: row.updatedAt ? toIso(row.updatedAt) : undefined,
  };
}
