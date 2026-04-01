-- AlterTable
ALTER TABLE "records" ADD COLUMN     "ai_tool_used_other" TEXT,
ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_path" TEXT,
ADD COLUMN     "attachment_size" INTEGER,
ADD COLUMN     "attachment_type" TEXT;
