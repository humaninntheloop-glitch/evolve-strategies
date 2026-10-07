import { createAuditLog } from "@/lib/dal/audit-logs";
import { prisma } from "@/lib/prisma";
import type { AiOutputImpact, Prisma } from "@/generated/prisma";

export function selectStarterRequirements(impact: AiOutputImpact | null, sensitive: boolean) {
  const refs = [{ key: "NIST_AI_RMF", refs: ["GOVERN 2.1", "MAP 1.1"] }];
  if (impact === "CLIENT_COMMUNICATION" || impact === "EXTERNAL_REPORTS") refs.push({ key: "EU_AI_ACT", refs: ["Art. 50(4)", "Art. 50(5)"] });
  if (sensitive) {
    refs[0].refs.push("MAP 2.3", "MEASURE 2.10");
    refs.push({ key: "ISO_42001", refs: ["A.7.3", "A.7.4", "A.7.5"] });
  }
  // Consequential-use tier, not a legal determination of EU high-risk status.
  if (impact === "FINANCIAL_LEGAL" || impact === "REGULATORY_COMPLIANCE") refs[0].refs.push("MAP 1.5", "MAP 5.1", "MEASURE 2.5", "MANAGE 1.3");
  return refs;
}

export async function autoMapRecord(recordId: string, organizationId: string, actorId: string, transaction?: Prisma.TransactionClient) {
  const apply = async (tx: Prisma.TransactionClient) => {
    const record = await tx.record.findFirst({ where: { id: recordId, organizationId } });
    if (!record || record.status !== "SUBMITTED") throw new Error("Compliance mapping requires a submitted record");
    const required = selectStarterRequirements(record.aiOutputImpact, record.dataSensitivity);
    const requirements = await tx.frameworkRequirement.findMany({ where: { OR: required.map(rule => ({ framework: { key: rule.key }, refCode: { in: rule.refs } })) } });
    const expected = required.reduce((sum, rule) => sum + rule.refs.length, 0);
    if (requirements.length !== expected) throw new Error("Compliance starter set is incomplete; apply the seed SQL");
    for (const requirement of requirements) {
      const inserted = await tx.recordRequirement.createMany({ data: [{ recordId, requirementId: requirement.id, mappedById: actorId, autoMapped: true }], skipDuplicates: true });
      if (inserted.count) await createAuditLog({ organizationId, recordId, actorId, actionType: "REQUIREMENT_AUTO_MAPPED", metadata: { requirementId: requirement.id, refCode: requirement.refCode } }, tx);
    }
    // Insert-only: never delete or overwrite reviewer-confirmed mappings.
  };
  if (transaction) await apply(transaction);
  else await prisma.$transaction(apply);
}
