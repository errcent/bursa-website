-- QC Batch 2026-07-19 (4): Incentive & technical integrity (QC-20260719-13..-44, -01/-02).
-- Additive only. Idempotent (IF NOT EXISTS / guarded enum creation). The live Neon DB was
-- already synced via `prisma db push` (pre-existing migration-history drift blocked migrate dev
-- shadow replay without a destructive reset). Safe to run on fresh or existing DBs.

DO $$ BEGIN CREATE TYPE "SignalOutcome" AS ENUM ('PENDING','HIT_TARGET','HIT_STOP','EXPIRED','MANUAL_CLOSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SessionAttendanceStatus" AS ENUM ('SCHEDULED','ATTENDED','NO_SHOW','CANCELLED','FORFEITED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ModerationResolution" AS ENUM ('UPHELD','DISMISSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CourseDisputeCategory" AS ENUM ('CONTENT_QUALITY','OUTDATED','MISLEADING','TECHNICAL','ACCESS','OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CourseDisputeStatus" AS ENUM ('OPEN','MENTOR_REVIEW','RESOLVED_IMPROVED','RESOLVED_CREDIT','RESOLVED_REPLACEMENT','DISMISSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformCreditBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "moderationReportsUpheld" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "moderationReportsDismissed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MentorProfile" ADD COLUMN IF NOT EXISTS "sessionPriceInt" INTEGER;
ALTER TABLE "MentorProfile" ADD COLUMN IF NOT EXISTS "paidStudentsCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MentorAvailabilitySlot" ADD COLUMN IF NOT EXISTS "bookedAt" TIMESTAMP(3);
ALTER TABLE "MentorAvailabilitySlot" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "MentorAvailabilitySlot" ADD COLUMN IF NOT EXISTS "commitmentFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MentorAvailabilitySlot" ADD COLUMN IF NOT EXISTS "attendanceStatus" "SessionAttendanceStatus" NOT NULL DEFAULT 'SCHEDULED';

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "ratingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "bayesianRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "decayedRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "ratingUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "paidStudentsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "contentUpdatedAt" TIMESTAMP(3);

ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "isFlagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "flagReason" TEXT;

ALTER TABLE "TradingSignal" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "TradingSignal" ADD COLUMN IF NOT EXISTS "outcome" "SignalOutcome" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "TradingSignal" ADD COLUMN IF NOT EXISTS "realizedReturnPct" DOUBLE PRECISION;
ALTER TABLE "TradingSignal" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);

ALTER TABLE "ContentModerationQueue" ADD COLUMN IF NOT EXISTS "reporterWeight" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "ContentModerationQueue" ADD COLUMN IF NOT EXISTS "resolution" "ModerationResolution";

ALTER TABLE "CommissionRecord" ADD COLUMN IF NOT EXISTS "payoutDueAt" TIMESTAMP(3);
ALTER TABLE "CommissionRecord" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceHash" TEXT NOT NULL,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PollVote" (
  "id" TEXT NOT NULL,
  "pollId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CourseDispute" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "transactionId" TEXT,
  "category" "CourseDisputeCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "status" "CourseDisputeStatus" NOT NULL DEFAULT 'OPEN',
  "mentorResponse" TEXT,
  "resolutionNote" TEXT,
  "platformCreditIssued" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseDispute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_userId_deviceHash_key" ON "UserSession"("userId","deviceHash");
CREATE INDEX IF NOT EXISTS "UserSession_userId_revokedAt_idx" ON "UserSession"("userId","revokedAt");
CREATE INDEX IF NOT EXISTS "UserSession_userId_lastSeenAt_idx" ON "UserSession"("userId","lastSeenAt");
CREATE INDEX IF NOT EXISTS "MentorAvailabilitySlot_bookedByUserId_isBooked_idx" ON "MentorAvailabilitySlot"("bookedByUserId","isBooked");
CREATE INDEX IF NOT EXISTS "Course_isPublished_paidStudentsCount_idx" ON "Course"("isPublished","paidStudentsCount");
CREATE INDEX IF NOT EXISTS "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX IF NOT EXISTS "Enrollment_courseId_isPaid_idx" ON "Enrollment"("courseId","isPaid");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_userId_courseId_status_idx" ON "Transaction"("userId","courseId","status");
CREATE INDEX IF NOT EXISTS "Review_courseId_idx" ON "Review"("courseId");
CREATE INDEX IF NOT EXISTS "Review_courseId_createdAt_idx" ON "Review"("courseId","createdAt");
CREATE INDEX IF NOT EXISTS "TradingSignal_mentorId_outcome_idx" ON "TradingSignal"("mentorId","outcome");
CREATE INDEX IF NOT EXISTS "TradingSignal_status_expiresAt_idx" ON "TradingSignal"("status","expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PollVote_pollId_userId_key" ON "PollVote"("pollId","userId");
CREATE INDEX IF NOT EXISTS "PollVote_pollId_optionId_idx" ON "PollVote"("pollId","optionId");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseDispute_userId_courseId_key" ON "CourseDispute"("userId","courseId");
CREATE INDEX IF NOT EXISTS "CourseDispute_status_createdAt_idx" ON "CourseDispute"("status","createdAt");
CREATE INDEX IF NOT EXISTS "CourseDispute_courseId_status_idx" ON "CourseDispute"("courseId","status");
CREATE INDEX IF NOT EXISTS "ContentModerationQueue_status_createdAt_idx" ON "ContentModerationQueue"("status","createdAt");
CREATE INDEX IF NOT EXISTS "CommissionRecord_payoutStatus_payoutDueAt_idx" ON "CommissionRecord"("payoutStatus","payoutDueAt");

DO $$ BEGIN ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "TradingPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CourseDispute" ADD CONSTRAINT "CourseDispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CourseDispute" ADD CONSTRAINT "CourseDispute_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;