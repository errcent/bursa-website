-- CreateTable
CREATE TABLE "NoteUserBlob" (
    "id" TEXT NOT NULL,
    "apexUserId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteUserBlob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteUserBlob_apexUserId_key_key" ON "NoteUserBlob"("apexUserId", "key");
CREATE INDEX "NoteUserBlob_apexUserId_idx" ON "NoteUserBlob"("apexUserId");
