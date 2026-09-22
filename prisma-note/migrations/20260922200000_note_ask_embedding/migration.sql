-- Enable pgvector for Ask Your Journal retrieval (Neon supports this).
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "NoteAskEmbedding" (
    "id" TEXT NOT NULL,
    "apexUserId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteAskEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteAskEmbedding_apexUserId_ref_key" ON "NoteAskEmbedding"("apexUserId", "ref");
CREATE INDEX "NoteAskEmbedding_apexUserId_idx" ON "NoteAskEmbedding"("apexUserId");
