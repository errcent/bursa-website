-- Curated platform playlists: admin-managed, globally unique slug
ALTER TABLE "Playlist" ADD COLUMN "isCurated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Playlist" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX "Playlist_userId_slug_key";
DROP INDEX "Playlist_userId_createdAt_idx";

CREATE UNIQUE INDEX "Playlist_slug_key" ON "Playlist"("slug");
CREATE INDEX "Playlist_isCurated_isPublished_createdAt_idx" ON "Playlist"("isCurated", "isPublished", "createdAt");
