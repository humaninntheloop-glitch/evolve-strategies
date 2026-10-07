import { prisma } from "@/lib/prisma";
import { CompliancePanel } from "@/components/records/compliance-panel";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordById } from "@/lib/dal/records";
import { getAuditLogsByRecord } from "@/lib/dal/audit-logs";
import { matchVendors } from "@/lib/vendors";
import { RecordDetail } from "@/components/records/record-detail";

interface RecordPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const record = await getRecordById(id, user.organizationId);
  if (!record) notFound();

  // Creators can only view their own records
  if (user.role === "EMPLOYEE" && record.creatorId !== user.id) {
    notFound();
  }

  const approvals = await prisma.recordApproval.findMany({ where: { recordId: record.id }, include: { approver: { select: { fullName: true } } }, orderBy: { createdAt: "asc" } });
  const auditLogs = await getAuditLogsByRecord(record.id, user.organizationId);

  const requirements = await prisma.frameworkRequirement.findMany({ include: { framework: true }, orderBy: [{ frameworkId: "asc" }, { refCode: "asc" }] });
  const mappings = await prisma.recordRequirement.findMany({ where: { recordId: record.id },
    include: { requirement: { include: { framework: true } }, mappedBy: { select: { fullName: true } } } });
  const vendors = await matchVendors(record.aiToolUsed);
  return <>
    <RecordDetail record={record} auditLogs={auditLogs} user={user} approvals={approvals} vendors={vendors} />
    <CompliancePanel recordId={record.id} requirements={requirements} mappings={mappings} canEdit={user.role === "REVIEWER" || user.role === "ADMIN"} />
  </>;
}
