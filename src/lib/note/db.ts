import { PrismaClient } from "@/generated/note-client";

const globalForNote = globalThis as unknown as {
  notePrisma: PrismaClient | undefined;
};

export function getNotePrisma(): PrismaClient {
  const url = process.env.NOTE_DATABASE_URL;
  if (!url) {
    throw new Error("NOTE_DATABASE_URL is required for the Note Prisma client.");
  }
  const client =
    globalForNote.notePrisma ??
    new PrismaClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") {
    globalForNote.notePrisma = client;
  }
  return client;
}
