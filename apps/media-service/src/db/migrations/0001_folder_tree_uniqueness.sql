-- Media folders become a real tree (2026-07-20).
--
-- Two things happen here, in order, and the order matters:
--   1. MERGE the duplicate folders that already exist. A silently-swallowed create error in the
--      media picker let the owner's library accumulate fourteen folders named "Brand" and two
--      named "مشاريع" (rules change-log 2026-07-20, U23). The oldest of each group survives and
--      adopts the others' assets and subfolders; the rest are soft-deleted, never dropped, so
--      nothing is destroyed by a migration.
--   2. ENFORCE uniqueness from now on, so the class of bug cannot recur.
--
-- Uniqueness is per (parent, lower(name)) and PARTIAL on live rows, so a soft-deleted folder
-- never blocks re-using its name.

--> statement-breakpoint
-- 1a. Pick a survivor per (parent_id, lower(name)) group: the oldest live folder.
CREATE TEMPORARY TABLE media_folder_dupes AS
SELECT
  f.id                AS duplicate_id,
  first_value(f.id) OVER (
    PARTITION BY f.parent_id, lower(f.name)
    ORDER BY f.created_at, f.id
  )                   AS survivor_id
FROM media_folder f
WHERE f.deleted_at IS NULL;
--> statement-breakpoint

-- 1b. Move the duplicates' assets onto the survivor.
UPDATE media_asset a
SET folder_id = d.survivor_id,
    updated_at = now()
FROM media_folder_dupes d
WHERE a.folder_id = d.duplicate_id
  AND d.duplicate_id <> d.survivor_id;
--> statement-breakpoint

-- 1c. Re-parent the duplicates' subfolders onto the survivor.
UPDATE media_folder f
SET parent_id = d.survivor_id,
    updated_at = now()
FROM media_folder_dupes d
WHERE f.parent_id = d.duplicate_id
  AND d.duplicate_id <> d.survivor_id;
--> statement-breakpoint

-- 1d. Soft-delete the now-empty duplicates (recoverable; nothing is destroyed).
UPDATE media_folder f
SET deleted_at = now(),
    updated_at = now()
FROM media_folder_dupes d
WHERE f.id = d.duplicate_id
  AND d.duplicate_id <> d.survivor_id;
--> statement-breakpoint

DROP TABLE media_folder_dupes;
--> statement-breakpoint

-- 2. From now on, a live folder name is unique among its siblings.
CREATE UNIQUE INDEX IF NOT EXISTS "media_folder_parent_name_uidx"
  ON "media_folder" ("parent_id", lower("name"))
  WHERE "deleted_at" IS NULL;
