import { prisma } from "@/lib/prisma";
import type { RecordStatus } from "@/generated/prisma";
import type { DashboardStats, RecordWithRelations } from "@/types";

const recordInclude = {
  creator: { select: { id: true, fullName: true, email: true } },
  reviewer: { select: { id: true, fullName: true, email: true } },
};

export async function getRecordsByOrg(
  organizationId: string,
  options?: {
    status?: RecordStatus;
    creatorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
): Promise<RecordWithRelations[]> {
  const where: Record<string, unknown> = { organizationId };
  if (options?.status) where.status = options.status;
  if (options?.creatorId) where.creatorId = options.creatorId;

  if (options?.dateFrom || options?.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (options.dateFrom) createdAt.gte = options.dateFrom;
    if (options.dateTo) createdAt.lte = options.dateTo;
    where.createdAt = createdAt;
  }

  return prisma.record.findMany({
    where,
    include: recordInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecordById(
  id: string,
  organizationId: string
): Promise<RecordWithRelations | null> {
  return prisma.record.findFirst({
    where: { id, organizationId },
    include: recordInclude,
  });
}

export async function getSubmittedRecordsForReview(
  organizationId: string
): Promise<RecordWithRelations[]> {
  return prisma.record.findMany({
    where: { organizationId, status: "SUBMITTED" },
    include: recordInclude,
    orderBy: { submittedAt: "asc" },
  });
}

export async function getDashboardStats(
  organizationId: string
): Promise<DashboardStats> {
  const [total, draft, submitted, approved, rejected, recorded] =
    await Promise.all([
      prisma.record.count({ where: { organizationId } }),
      prisma.record.count({ where: { organizationId, status: "DRAFT" } }),
      prisma.record.count({ where: { organizationId, status: "SUBMITTED" } }),
      prisma.record.count({ where: { organizationId, status: "APPROVED" } }),
      prisma.record.count({ where: { organizationId, status: "REJECTED" } }),
      prisma.record.count({ where: { organizationId, status: "RECORDED" } }),
    ]);

  return {
    totalRecords: total,
    draftRecords: draft,
    submittedRecords: submitted,
    approvedRecords: approved,
    rejectedRecords: rejected,
    recordedRecords: recorded,
    pendingReview: submitted,
  };
}

export async function getRecentRecords(
  organizationId: string,
  options?: { creatorId?: string; limit?: number }
): Promise<RecordWithRelations[]> {
  const where: Record<string, unknown> = { organizationId };
  if (options?.creatorId) where.creatorId = options.creatorId;

  return prisma.record.findMany({
    where,
    include: recordInclude,
    orderBy: { updatedAt: "desc" },
    take: options?.limit ?? 5,
  });
}

export async function getMyDashboardStats(
  organizationId: string,
  userId: string
): Promise<DashboardStats> {
  const [total, draft, submitted, approved, rejected, recorded] =
    await Promise.all([
      prisma.record.count({ where: { organizationId, creatorId: userId } }),
      prisma.record.count({ where: { organizationId, creatorId: userId, status: "DRAFT" } }),
      prisma.record.count({ where: { organizationId, creatorId: userId, status: "SUBMITTED" } }),
      prisma.record.count({ where: { organizationId, creatorId: userId, status: "APPROVED" } }),
      prisma.record.count({ where: { organizationId, creatorId: userId, status: "REJECTED" } }),
      prisma.record.count({ where: { organizationId, creatorId: userId, status: "RECORDED" } }),
    ]);

  return {
    totalRecords: total,
    draftRecords: draft,
    submittedRecords: submitted,
    approvedRecords: approved,
    rejectedRecords: rejected,
    recordedRecords: recorded,
    pendingReview: submitted,
  };
}
