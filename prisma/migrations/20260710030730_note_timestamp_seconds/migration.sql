-- AlterTable
ALTER TABLE "Note" ADD COLUMN "timestampSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Note_userId_lessonId_idx" ON "Note"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "Note_lessonId_timestampSeconds_idx" ON "Note"("lessonId", "timestampSeconds");
