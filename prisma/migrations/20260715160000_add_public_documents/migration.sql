-- CreateEnum
CREATE TYPE "DocumentPortal" AS ENUM ('PRIVACY', 'TRUST', 'LEGAL');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION', 'WITHDRAW_CONSENT', 'OBJECTION', 'PORTABILITY');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "PublicDocument" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "portal" "DocumentPortal" NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "markdownBody" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "sourceVaultPath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestType" "DataSubjectRequestType" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicDocument_portal_status_idx" ON "PublicDocument"("portal", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PublicDocument_portal_slug_key" ON "PublicDocument"("portal", "slug");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_createdAt_idx" ON "DataSubjectRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_email_idx" ON "DataSubjectRequest"("email");