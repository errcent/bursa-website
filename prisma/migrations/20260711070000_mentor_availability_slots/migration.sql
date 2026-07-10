-- CreateTable
CREATE TABLE "MentorAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookedByUserId" TEXT,
    "createdByAdminId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorAvailabilitySlot_mentorId_startAt_idx" ON "MentorAvailabilitySlot"("mentorId", "startAt");

-- CreateIndex
CREATE INDEX "MentorAvailabilitySlot_mentorId_isBooked_startAt_idx" ON "MentorAvailabilitySlot"("mentorId", "isBooked", "startAt");

-- AddForeignKey
ALTER TABLE "MentorAvailabilitySlot" ADD CONSTRAINT "MentorAvailabilitySlot_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailabilitySlot" ADD CONSTRAINT "MentorAvailabilitySlot_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailabilitySlot" ADD CONSTRAINT "MentorAvailabilitySlot_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
