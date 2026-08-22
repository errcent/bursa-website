-- AlterTable
ALTER TABLE "PublicDocument" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'id';

-- DropIndex
DROP INDEX "PublicDocument_portal_slug_key";

-- DropIndex
DROP INDEX "PublicDocument_portal_status_idx";

-- CreateIndex
CREATE UNIQUE INDEX "PublicDocument_portal_slug_locale_key" ON "PublicDocument"("portal", "slug", "locale");

-- CreateIndex
CREATE INDEX "PublicDocument_portal_status_locale_idx" ON "PublicDocument"("portal", "status", "locale");
