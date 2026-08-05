-- Bookmarks + phone encryption support (QC-20260720-01, QC-20260806-05)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "BookmarkTargetType" AS ENUM ('COURSE', 'LESSON', 'PLAYLIST', 'MENTOR');

CREATE TABLE "BookmarkItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "type" "BookmarkTargetType" NOT NULL,
    "slug" TEXT,
    "courseSlug" TEXT,
    "lessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookmarkItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookmarkItem_userId_targetKey_key" ON "BookmarkItem"("userId", "targetKey");
CREATE INDEX "BookmarkItem_userId_type_createdAt_idx" ON "BookmarkItem"("userId", "type", "createdAt");

ALTER TABLE "BookmarkItem" ADD CONSTRAINT "BookmarkItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneHash" TEXT;

DROP INDEX IF EXISTS "User_phone_key";

CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneHash_key" ON "User"("phoneHash");

UPDATE "User"
SET "phoneHash" = encode(digest(lower(regexp_replace(coalesce("phone", ''), '\s+', '', 'g'))::bytea, 'sha256'), 'hex')
WHERE "phone" IS NOT NULL AND "phone" <> '' AND "phoneHash" IS NULL;