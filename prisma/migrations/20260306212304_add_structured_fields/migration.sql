-- CreateEnum
CREATE TYPE "AiOutputImpact" AS ENUM ('INTERNAL_NOTES', 'INTERNAL_DOCUMENT', 'CLIENT_COMMUNICATION', 'EXTERNAL_REPORTS', 'FINANCIAL_LEGAL', 'REGULATORY_COMPLIANCE');

-- AlterTable
ALTER TABLE "records" ADD COLUMN     "ai_justification" TEXT,
ADD COLUMN     "ai_output_impact" "AiOutputImpact",
ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "ai_usage_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ai_usage_type_other" TEXT,
ADD COLUMN     "human_review_plan" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "human_review_plan_other" TEXT,
ALTER COLUMN "distribution_context" DROP NOT NULL,
ALTER COLUMN "high_stakes_decision" DROP NOT NULL;
