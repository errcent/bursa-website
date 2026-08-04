-- Additive lifecycle foundation for single-opt-in waitlist contacts.
CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'SUPPRESSED', 'CONVERTED');
CREATE TYPE "WaitlistLifecycleStage" AS ENUM ('CONFIRMED', 'NURTURE', 'ENGAGED', 'LAUNCH', 'CONVERTED');
CREATE TYPE "WaitlistSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');
CREATE TYPE "WaitlistEmailEventType" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED', 'SUPPRESSED');

ALTER TABLE "WaitlistEntry"
  ADD COLUMN "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "consentVersion" TEXT NOT NULL DEFAULT 'waitlist-v1',
  ADD COLUMN "consentPurpose" TEXT NOT NULL DEFAULT 'waitlist_updates',
  ADD COLUMN "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "lifecycleStage" "WaitlistLifecycleStage" NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN "resendContactId" TEXT,
  ADD COLUMN "resendSyncStatus" "WaitlistSyncStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "resendSyncError" TEXT,
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
  ADD COLUMN "automationEnrolledAt" TIMESTAMP(3),
  ADD COLUMN "lastMarketingEmailAt" TIMESTAMP(3),
  ADD COLUMN "experienceLevel" TEXT,
  ADD COLUMN "learningGoal" TEXT,
  ADD COLUMN "marketInterest" TEXT,
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'id',
  ADD COLUMN "wantsProductUpdates" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "wantsEducation" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "wantsLaunchNews" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "engagedAt" TIMESTAMP(3),
  ADD COLUMN "unsubscribedAt" TIMESTAMP(3),
  ADD COLUMN "suppressedAt" TIMESTAMP(3),
  ADD COLUMN "suppressionReason" TEXT,
  ADD COLUMN "convertedAt" TIMESTAMP(3),
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "referredByCode" TEXT;

UPDATE "WaitlistEntry" SET "consentedAt" = "createdAt";
UPDATE "WaitlistEntry"
SET "referralCode" = 'legacy_' || substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 24);
ALTER TABLE "WaitlistEntry" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE TABLE "WaitlistEmailEvent" (
  "id" TEXT NOT NULL,
  "waitlistEntryId" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "eventType" "WaitlistEmailEventType" NOT NULL,
  "templateKey" TEXT,
  "isMarketing" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaitlistEmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_resendContactId_key" ON "WaitlistEntry"("resendContactId");
CREATE UNIQUE INDEX "WaitlistEntry_referralCode_key" ON "WaitlistEntry"("referralCode");
CREATE INDEX "WaitlistEntry_status_createdAt_idx" ON "WaitlistEntry"("status", "createdAt");
CREATE INDEX "WaitlistEntry_lifecycleStage_status_idx" ON "WaitlistEntry"("lifecycleStage", "status");
CREATE INDEX "WaitlistEntry_resendSyncStatus_updatedAt_idx" ON "WaitlistEntry"("resendSyncStatus", "updatedAt");
CREATE INDEX "WaitlistEntry_referredByCode_idx" ON "WaitlistEntry"("referredByCode");
CREATE UNIQUE INDEX "WaitlistEmailEvent_providerEventId_key" ON "WaitlistEmailEvent"("providerEventId");
CREATE INDEX "WaitlistEmailEvent_waitlistEntryId_occurredAt_idx" ON "WaitlistEmailEvent"("waitlistEntryId", "occurredAt");
CREATE INDEX "WaitlistEmailEvent_providerMessageId_idx" ON "WaitlistEmailEvent"("providerMessageId");
CREATE INDEX "WaitlistEmailEvent_eventType_occurredAt_idx" ON "WaitlistEmailEvent"("eventType", "occurredAt");
ALTER TABLE "WaitlistEmailEvent"
  ADD CONSTRAINT "WaitlistEmailEvent_waitlistEntryId_fkey"
  FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;