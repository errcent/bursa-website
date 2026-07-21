-- QC-20260719-49: preserve never vs demo nuance in learning guidance profile round-trip
-- Idempotent, non-destructive (IF NOT EXISTS)

DO $$ BEGIN
  CREATE TYPE "LearningExperience" AS ENUM ('NEVER', 'DEMO', 'REGULAR', 'PROFITABLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "LearningGuidanceProfile"
  ADD COLUMN IF NOT EXISTS "experienceTier" "LearningExperience" NOT NULL DEFAULT 'DEMO';