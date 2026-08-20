-- Mentor pipeline: replace monolith application columns with L1/L2 JSON + status machine.

CREATE TYPE "MentorApplicationTrack" AS ENUM ('OPEN', 'DIRECT', 'STRATEGIC');

CREATE TYPE "MentorApplicationStatus_new" AS ENUM (
    'SUBMITTED',
    'SCREENING',
    'L2_INVITED',
    'L2_IN_PROGRESS',
    'L2_SUBMITTED',
    'REVIEW',
    'ASSESSMENT',
    'FINAL_REVIEW',
    'APPROVED',
    'ONBOARDING',
    'PRODUCTION_READY',
    'REJECTED',
    'TALENT_POOL',
    'REVISION_REQUIRED',
    'INFO_REQUIRED',
    'DIRECT_INVITED'
);

CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TYPE "EmailOutboxTemplate" AS ENUM (
    'APPLICATION_RECEIVED',
    'APPLICATION_L2_INVITATION',
    'APPLICATION_REJECTED',
    'APPLICATION_TALENT_POOL',
    'APPLICATION_INFO_REQUIRED'
);

ALTER TABLE "MentorApplication"
    ADD COLUMN "track" "MentorApplicationTrack" NOT NULL DEFAULT 'OPEN',
    ADD COLUMN "l1Answers" JSONB,
    ADD COLUMN "l2Answers" JSONB,
    ADD COLUMN "l2TokenHash" TEXT,
    ADD COLUMN "l2TokenExpiresAt" TIMESTAMP(3),
    ADD COLUMN "adminNote" TEXT,
    ADD COLUMN "legacyPayload" JSONB,
    ADD COLUMN "status_new" "MentorApplicationStatus_new";

UPDATE "MentorApplication"
SET
    "legacyPayload" = jsonb_build_object(
        'fullName', "fullName",
        'email', "email",
        'phone', "phone",
        'professionalTitle', "professionalTitle",
        'instruments', "instruments",
        'yearsExperience', "yearsExperience",
        'licenseLabel', "licenseLabel",
        'bio', "bio",
        'philosophy', "philosophy",
        'portfolioUrl', "portfolioUrl",
        'hasExistingContent', "hasExistingContent",
        'estimatedCoursePrice', "estimatedCoursePrice",
        'agreedToTerms', "agreedToTerms",
        'cvDocumentUrl', "cvDocumentUrl",
        'cvDocumentName', "cvDocumentName",
        'certificateDocumentUrl', "certificateDocumentUrl",
        'certificateDocumentName', "certificateDocumentName",
        'legacyStatus', "status"::text
    ),
    "l1Answers" = jsonb_strip_nulls(jsonb_build_object(
        'l1_full_name', "fullName",
        'l1_email', "email",
        'l1_country', '',
        'l1_city', '',
        'l1_linkedin_url', '',
        'l1_website_url', "portfolioUrl",
        'l1_expertise', '[]'::jsonb,
        'l1_primary_expertise', '',
        'l1_years_experience', CASE
            WHEN "yearsExperience" < 1 THEN 'lt_1'
            WHEN "yearsExperience" <= 3 THEN '1_3'
            WHEN "yearsExperience" <= 5 THEN '3_5'
            WHEN "yearsExperience" <= 10 THEN '5_10'
            ELSE '10_plus'
        END,
        'l1_professional_background', left("bio", 500),
        'l1_why_bursanalar', left("philosophy", 800),
        'l1_unique_knowledge', left("philosophy", 800),
        'l1_extra_links', '[]'::jsonb,
        'l1_confirmation', "agreedToTerms",
        'legacyIncomplete', true
    )),
    "status_new" = CASE "status"::text
        WHEN 'PENDING' THEN 'SCREENING'::"MentorApplicationStatus_new"
        WHEN 'REVIEWING' THEN 'REVIEW'::"MentorApplicationStatus_new"
        WHEN 'APPROVED' THEN 'APPROVED'::"MentorApplicationStatus_new"
        WHEN 'REJECTED' THEN 'REJECTED'::"MentorApplicationStatus_new"
        ELSE 'SCREENING'::"MentorApplicationStatus_new"
    END;

UPDATE "MentorApplication" SET "l1Answers" = '{}'::jsonb WHERE "l1Answers" IS NULL;
UPDATE "MentorApplication" SET "status_new" = 'SCREENING' WHERE "status_new" IS NULL;

ALTER TABLE "MentorApplication" ALTER COLUMN "l1Answers" SET NOT NULL;
ALTER TABLE "MentorApplication" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "MentorApplication" ALTER COLUMN "status_new" SET DEFAULT 'SCREENING';

DROP INDEX IF EXISTS "MentorApplication_status_createdAt_idx";

ALTER TABLE "MentorApplication"
    DROP COLUMN "status",
    DROP COLUMN "phone",
    DROP COLUMN "professionalTitle",
    DROP COLUMN "instruments",
    DROP COLUMN "yearsExperience",
    DROP COLUMN "licenseLabel",
    DROP COLUMN "bio",
    DROP COLUMN "philosophy",
    DROP COLUMN "portfolioUrl",
    DROP COLUMN "hasExistingContent",
    DROP COLUMN "estimatedCoursePrice",
    DROP COLUMN "agreedToTerms",
    DROP COLUMN "cvDocumentUrl",
    DROP COLUMN "cvDocumentName",
    DROP COLUMN "certificateDocumentUrl",
    DROP COLUMN "certificateDocumentName";

DROP TYPE "MentorApplicationStatus";
ALTER TYPE "MentorApplicationStatus_new" RENAME TO "MentorApplicationStatus";
ALTER TABLE "MentorApplication" RENAME COLUMN "status_new" TO "status";

CREATE UNIQUE INDEX "MentorApplication_l2TokenHash_key" ON "MentorApplication"("l2TokenHash");
CREATE INDEX "MentorApplication_status_createdAt_idx" ON "MentorApplication"("status", "createdAt");

CREATE TABLE "MentorApplicationStatusEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "MentorApplicationStatus",
    "toStatus" "MentorApplicationStatus" NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorApplicationStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MentorApplicationStatusEvent_applicationId_createdAt_idx"
    ON "MentorApplicationStatusEvent"("applicationId", "createdAt");

ALTER TABLE "MentorApplicationStatusEvent"
    ADD CONSTRAINT "MentorApplicationStatusEvent_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "MentorApplication"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "to" TEXT NOT NULL,
    "template" "EmailOutboxTemplate" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailOutbox_status_createdAt_idx" ON "EmailOutbox"("status", "createdAt");

ALTER TABLE "EmailOutbox"
    ADD CONSTRAINT "EmailOutbox_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "MentorApplication"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
