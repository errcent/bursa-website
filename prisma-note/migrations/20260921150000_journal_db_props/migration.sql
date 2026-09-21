-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "properties" JSONB;
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "NoteJournalSchema" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteJournalSchema_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NoteJournalSchema_accountId_key" ON "NoteJournalSchema"("accountId");

DO $$ BEGIN
 ALTER TABLE "NoteJournalSchema" ADD CONSTRAINT "NoteJournalSchema_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "NoteAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
