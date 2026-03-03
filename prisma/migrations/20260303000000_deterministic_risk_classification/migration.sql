-- CreateEnum
CREATE TYPE "DistributionContext" AS ENUM ('INTERNAL', 'EXTERNAL');

-- Temporarily disable immutability trigger so we can migrate RECORDED records
DROP TRIGGER IF EXISTS enforce_record_immutability ON records;

-- Add new columns with defaults for existing rows
ALTER TABLE "records" ADD COLUMN "distribution_context" "DistributionContext";
ALTER TABLE "records" ADD COLUMN "data_sensitivity" BOOLEAN;
ALTER TABLE "records" ADD COLUMN "high_stakes_decision" BOOLEAN;

-- Migrate existing data based on old DataClassification values
-- PUBLIC/INTERNAL → INTERNAL, sensitivity=false, high_stakes=false
-- CONFIDENTIAL → EXTERNAL, sensitivity=true, high_stakes=false
-- RESTRICTED → EXTERNAL, sensitivity=true, high_stakes=true
UPDATE "records" SET
  "distribution_context" = CASE
    WHEN "data_classification" IN ('PUBLIC', 'INTERNAL') THEN 'INTERNAL'::"DistributionContext"
    ELSE 'EXTERNAL'::"DistributionContext"
  END,
  "data_sensitivity" = CASE
    WHEN "data_classification" IN ('CONFIDENTIAL', 'RESTRICTED') THEN true
    ELSE false
  END,
  "high_stakes_decision" = CASE
    WHEN "data_classification" = 'RESTRICTED' THEN true
    ELSE false
  END;

-- Now make the columns NOT NULL
ALTER TABLE "records" ALTER COLUMN "distribution_context" SET NOT NULL;
ALTER TABLE "records" ALTER COLUMN "data_sensitivity" SET NOT NULL;
ALTER TABLE "records" ALTER COLUMN "high_stakes_decision" SET NOT NULL;

-- Drop old column and enum
ALTER TABLE "records" DROP COLUMN "data_classification";
DROP TYPE "DataClassification";

-- Re-enable immutability trigger
CREATE TRIGGER enforce_record_immutability
  BEFORE UPDATE OR DELETE ON records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_recorded_mutation();
