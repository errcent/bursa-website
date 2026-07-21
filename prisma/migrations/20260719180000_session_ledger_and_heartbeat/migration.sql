-- QC-20260719-22/47 (session-payment ledger) + QC-20260719-46 (verified watch heartbeat).
-- Additive & non-destructive: new nullable/defaulted columns, relaxes Transaction.courseId
-- NOT NULL, adds indexes + FKs. Written idempotently (guards) so it is safe to re-run and to
-- reconcile with a live Neon DB previously kept in sync via db push (see QC-20260719-45).

-- CreateEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionKind') THEN
    CREATE TYPE "TransactionKind" AS ENUM ('COURSE', 'SESSION');
  END IF;
END
$$;

-- AlterTable: LessonProgress verified-watch fields (QC-20260719-46)
ALTER TABLE "LessonProgress"
  ADD COLUMN IF NOT EXISTS "verifiedWatchedSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "heartbeatPosition" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Transaction session-payment linkage (QC-20260719-22/47)
ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "kind" "TransactionKind" NOT NULL DEFAULT 'COURSE',
  ADD COLUMN IF NOT EXISTS "mentorId" TEXT,
  ADD COLUMN IF NOT EXISTS "mentorSessionId" TEXT;

ALTER TABLE "Transaction" ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Transaction_mentorSessionId_idx" ON "Transaction"("mentorSessionId");
CREATE INDEX IF NOT EXISTS "Transaction_mentorId_kind_idx" ON "Transaction"("mentorId", "kind");

-- Re-point courseId FK to ON DELETE SET NULL (now nullable); drop-then-add = idempotent.
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_courseId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: session + mentor linkage (drop-then-add = idempotent)
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_mentorSessionId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_mentorSessionId_fkey"
  FOREIGN KEY ("mentorSessionId") REFERENCES "MentorAvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_mentorId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_mentorId_fkey"
  FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;