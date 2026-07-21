-- AlterTable
ALTER TABLE "KnowledgeChunk" ADD COLUMN "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];