-- Convert ai_tool_used from scalar TEXT to TEXT[] via add-copy-drop-rename,
-- which avoids the ambiguous USING-cast path that fails on empty-string rows.
-- The immutability trigger disallows updating RECORDED rows, so we disable it
-- temporarily for the one-time backfill and re-enable it at the end.

ALTER TABLE "records" DISABLE TRIGGER "enforce_record_immutability";

ALTER TABLE "records" ADD COLUMN "ai_tool_used_new" TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

UPDATE "records"
SET "ai_tool_used_new" = CASE
  WHEN "ai_tool_used" IS NULL OR "ai_tool_used" = '' THEN '{}'::TEXT[]
  ELSE ARRAY["ai_tool_used"]
END;

ALTER TABLE "records" DROP COLUMN "ai_tool_used";
ALTER TABLE "records" RENAME COLUMN "ai_tool_used_new" TO "ai_tool_used";

ALTER TABLE "records" ENABLE TRIGGER "enforce_record_immutability";
