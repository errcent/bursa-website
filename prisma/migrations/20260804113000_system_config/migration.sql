-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "waitlistLifecycleApprovedAt" TIMESTAMP(3),
    "waitlistLifecycleApprovedByUserId" TEXT,
    "waitlistLifecycleApprovalNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);
