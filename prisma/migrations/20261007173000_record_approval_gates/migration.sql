CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');
CREATE TABLE "record_approvals" (
 "id" UUID NOT NULL,
 "record_id" UUID NOT NULL,
 "approver_id" UUID NOT NULL,
 "decision" "ApprovalDecision" NOT NULL,
 "rationale" TEXT NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "record_approvals_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "record_approvals_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "records"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "record_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "record_approvals_record_id_approver_id_key" ON "record_approvals"("record_id", "approver_id");
CREATE FUNCTION prevent_approval_mutation() RETURNS TRIGGER AS $$
BEGIN
 RAISE EXCEPTION 'Approval decisions are immutable. Cannot % approval entries.', TG_OP;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER enforce_approval_immutability BEFORE UPDATE OR DELETE ON "record_approvals"
FOR EACH ROW EXECUTE FUNCTION prevent_approval_mutation();
