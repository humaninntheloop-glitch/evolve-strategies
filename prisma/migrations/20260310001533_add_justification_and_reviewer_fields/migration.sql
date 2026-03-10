-- AlterTable
ALTER TABLE "records" ADD COLUMN     "ai_use_justification" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ai_use_justification_other" TEXT,
ADD COLUMN     "reviewer_decision_rationale" TEXT,
ADD COLUMN     "reviewer_decision_rationale_other" TEXT,
ADD COLUMN     "reviewer_validation_reference" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reviewer_validation_reference_other" TEXT;
