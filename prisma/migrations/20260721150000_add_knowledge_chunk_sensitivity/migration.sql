-- CreateEnum
CREATE TYPE "KnowledgeChunkSensitivity" AS ENUM ('PUBLIC', 'INTERNAL');

-- AlterTable
ALTER TABLE "KnowledgeChunk" ADD COLUMN "sensitivity" "KnowledgeChunkSensitivity" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "KnowledgeChunk_sensitivity_idx" ON "KnowledgeChunk"("sensitivity");