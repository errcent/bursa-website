import { getNotePrisma } from "@/lib/note/db";
import type { CreateEntryInput, JournalEntry } from "@/lib/note/types";
import { buildJournalEntry } from "@/lib/note/build-entry";
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
    const db = getNotePrisma();
    const account = await db.noteAccount.findUnique({
      where: { apexUserId },
      include: { entries: { orderBy: { createdAt: "desc" } } },
    });
    if (!account) return [];
    return account.entries.map((row) => mapRow(apexUserId, row));
  },

  async createEntry(apexUserId, input: CreateEntryInput) {
    const db = getNotePrisma();
    const account = await db.noteAccount.upsert({
      where: { apexUserId },
      create: { apexUserId, plus: false },
      update: {},
    });
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
        openedAt: new Date(built.openedAt),
        createdAt: new Date(built.createdAt),
      },
    });
    return mapRow(apexUserId, row);
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
    openedAt: Date;
    createdAt: Date;
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
    openedAt: toIso(row.openedAt),
    createdAt: toIso(row.createdAt),
  };
}
