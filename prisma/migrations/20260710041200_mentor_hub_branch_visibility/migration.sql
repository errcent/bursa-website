-- AlterTable: visibility on cabang (SQLite stores enums as TEXT)
ALTER TABLE "ChatBranch" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

-- Existing branches under non-staff MENTOR_INTERNAL rooms become PRIVATE
UPDATE "ChatBranch"
SET "visibility" = 'PRIVATE'
WHERE "roomId" IN (
  SELECT id FROM "ChatRoom"
  WHERE "roomKind" = 'MENTOR_INTERNAL'
    AND "isStaffCollaboration" = 0
);

-- Promote orphan MENTOR_INTERNAL rooms (no community hub) into MENTOR_COMMUNITY hubs
UPDATE "ChatRoom"
SET
  "roomKind" = 'MENTOR_COMMUNITY',
  "tier" = 'PEMULA',
  "isProtected" = 0,
  "screenshotProtection" = 0
WHERE "roomKind" = 'MENTOR_INTERNAL'
  AND "isStaffCollaboration" = 0
  AND "isActive" = 1
  AND "mentorId" IS NOT NULL
  AND "mentorId" NOT IN (
    SELECT "mentorId" FROM "ChatRoom"
    WHERE "roomKind" = 'MENTOR_COMMUNITY'
      AND "isStaffCollaboration" = 0
      AND "isActive" = 1
      AND "mentorId" IS NOT NULL
  );

-- Keep promoted-hub branches private (they came from internal)
UPDATE "ChatBranch"
SET "visibility" = 'PRIVATE'
WHERE "roomId" IN (
  SELECT id FROM "ChatRoom"
  WHERE "roomKind" = 'MENTOR_COMMUNITY'
    AND "isStaffCollaboration" = 0
)
AND "visibility" = 'PRIVATE';

-- Deactivate duplicate MENTOR_INTERNAL surface rooms when a hub already exists.
-- Branch/message merge for duplicates is handled by re-seed or admin; SQLite
-- cannot easily move rows with slug conflicts in a portable migration.
UPDATE "ChatRoom"
SET "isActive" = 0
WHERE "roomKind" = 'MENTOR_INTERNAL'
  AND "isStaffCollaboration" = 0
  AND "isActive" = 1
  AND "mentorId" IN (
    SELECT "mentorId" FROM "ChatRoom"
    WHERE "roomKind" = 'MENTOR_COMMUNITY'
      AND "isStaffCollaboration" = 0
      AND "isActive" = 1
      AND "mentorId" IS NOT NULL
  );
