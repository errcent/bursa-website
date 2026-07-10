-- CreateTable
CREATE TABLE "CourseChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "moduleId" TEXT,
    "lessonId" TEXT,
    "summary" TEXT NOT NULL,
    "currentSnapshot" JSONB,
    "proposedData" JSONB,
    "appliedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseChangeRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseChangeRequest_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CourseChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CourseChangeRequest_status_createdAt_idx" ON "CourseChangeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CourseChangeRequest_courseId_idx" ON "CourseChangeRequest"("courseId");

-- CreateIndex
CREATE INDEX "CourseChangeRequest_mentorUserId_idx" ON "CourseChangeRequest"("mentorUserId");
