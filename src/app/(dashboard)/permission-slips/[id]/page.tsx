import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordById } from "@/lib/dal/records";
import { getAuditLogsByRecord } from "@/lib/dal/audit-logs";
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

  const auditLogs = await getAuditLogsByRecord(record.id, user.organizationId);

  return <RecordDetail record={record} auditLogs={auditLogs} user={user} />;
}
