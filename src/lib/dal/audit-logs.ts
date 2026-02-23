import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { AuditLogEntry } from "@/types";

export async function createAuditLog(data: {
  organizationId: string;
  recordId: string;
  actionType: string;
  actorId: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId: data.organizationId,
      recordId: data.recordId,
      actionType: data.actionType,
      actorId: data.actorId,
      previousState: data.previousState ?? null,
      newState: data.newState ?? null,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

export async function getAuditLogsByRecord(
  recordId: string,
  organizationId: string
): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { recordId, organizationId },
    include: {
      actor: { select: { fullName: true, email: true } },
    },
    orderBy: { timestamp: "desc" },
  });

  return logs.map((log) => ({
    ...log,
    metadata: log.metadata as Record<string, unknown> | null,
  }));
}

export async function getAuditLogsByOrg(
  organizationId: string,
  options?: { page?: number; pageSize?: number }
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        actor: { select: { fullName: true, email: true } },
      },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where: { organizationId } }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      metadata: log.metadata as Record<string, unknown> | null,
    })),
    total,
  };
}
