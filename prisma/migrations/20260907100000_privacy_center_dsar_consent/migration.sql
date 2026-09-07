-- CreateEnum
CREATE TYPE "DataSubjectType" AS ENUM ('ACCOUNT', 'NON_ACCOUNT', 'MENTOR_APPLICANT');

-- AlterTable
ALTER TABLE "DataSubjectRequest" ADD COLUMN "referenceCode" TEXT,
ADD COLUMN "subjectType" "DataSubjectType",
ADD COLUMN "statusTokenHash" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

UPDATE "DataSubjectRequest"
SET "referenceCode" = 'DSR-LEGACY-' || SUBSTRING("id", 1, 8)
WHERE "referenceCode" IS NULL;

ALTER TABLE "DataSubjectRequest" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE UNIQUE INDEX "DataSubjectRequest_referenceCode_key" ON "DataSubjectRequest"("referenceCode");
CREATE INDEX "DataSubjectRequest_referenceCode_idx" ON "DataSubjectRequest"("referenceCode");

CREATE TABLE "DsarStatusOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DsarStatusOtp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CookieConsentRecord" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "version" TEXT NOT NULL DEFAULT '2026-07',
    "locale" TEXT NOT NULL DEFAULT 'id',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CookieConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DsarStatusOtp_email_referenceCode_idx" ON "DsarStatusOtp"("email", "referenceCode");
CREATE INDEX "CookieConsentRecord_visitorId_createdAt_idx" ON "CookieConsentRecord"("visitorId", "createdAt");
