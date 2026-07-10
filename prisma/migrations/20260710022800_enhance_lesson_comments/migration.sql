-- AlterTable
ALTER TABLE "LessonQuestion" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LessonQuestion" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LessonQuestionLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonQuestionLike_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "LessonQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonQuestionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonQuestionLike_questionId_userId_key" ON "LessonQuestionLike"("questionId", "userId");
