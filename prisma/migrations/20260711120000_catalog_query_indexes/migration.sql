-- CreateIndex
CREATE INDEX "Course_isPublished_studentsCount_idx" ON "Course"("isPublished", "studentsCount");

-- CreateIndex
CREATE INDEX "MentorProfile_verificationStatus_studentsCount_idx" ON "MentorProfile"("verificationStatus", "studentsCount");
