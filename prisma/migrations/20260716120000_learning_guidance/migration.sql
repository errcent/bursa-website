-- Enums (idempotent — safe if a prior deploy attempt partially applied)
DO $$ BEGIN CREATE TYPE "LearningTradingStyle" AS ENUM ('SCALPING', 'SWING', 'LONG_TERM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LearningGoal" AS ENUM ('SIDE_INCOME', 'WEALTH_BUILDING', 'LEARN_BASICS', 'RETIREMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LearningRiskTolerance" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LearningTimeAvailability" AS ENUM ('MINIMAL', 'PART_TIME', 'DEDICATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LearningCapitalRange" AS ENUM ('UNDER_5M', 'FROM_5M_TO_20M', 'FROM_20M_TO_50M', 'ABOVE_50M', 'PREFER_NOT_SAY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LearningFormat" AS ENUM ('VIDEO', 'LIVE', 'COMMUNITY', 'MIXED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearningGuidanceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instrument" "Instrument" NOT NULL,
    "experienceLevel" "CourseLevel" NOT NULL,
    "tradingStyle" "LearningTradingStyle" NOT NULL,
    "goal" "LearningGoal" NOT NULL,
    "riskTolerance" "LearningRiskTolerance" NOT NULL,
    "timeAvailability" "LearningTimeAvailability" NOT NULL,
    "capitalRange" "LearningCapitalRange",
    "learningFormat" "LearningFormat" NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningGuidanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearningGuidanceProfile_userId_key" ON "LearningGuidanceProfile"("userId");
CREATE INDEX IF NOT EXISTS "LearningGuidanceProfile_instrument_experienceLevel_idx" ON "LearningGuidanceProfile"("instrument", "experienceLevel");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "LearningGuidanceProfile" ADD CONSTRAINT "LearningGuidanceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;