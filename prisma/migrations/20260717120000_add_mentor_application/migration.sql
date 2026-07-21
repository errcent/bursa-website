-- CreateEnum
CREATE TYPE "MentorApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "MentorApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "professionalTitle" TEXT NOT NULL,
    "instruments" JSONB NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "licenseLabel" TEXT,
    "bio" TEXT NOT NULL,
    "philosophy" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "hasExistingContent" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCoursePrice" INTEGER,
    "agreedToTerms" BOOLEAN NOT NULL,
    "cvDocumentUrl" TEXT,
    "cvDocumentName" TEXT,
    "certificateDocumentUrl" TEXT,
    "certificateDocumentName" TEXT,
    "status" "MentorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorApplication_status_createdAt_idx" ON "MentorApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MentorApplication_email_idx" ON "MentorApplication"("email");
