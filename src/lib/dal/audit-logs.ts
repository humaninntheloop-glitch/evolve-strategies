import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma";
import type { AuditLogEntry } from "@/types";

export function canonicalJSON(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  if (typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function auditHash(row: { prevHash: string; recordId: string | null; actionType: string; actorId: string; timestamp: Date; metadata: unknown }) {
  return createHash("sha256").update(row.prevHash + (row.recordId ?? "") + row.actionType + row.actorId + row.timestamp.toISOString() + canonicalJSON(row.metadata)).digest("hex");
}

// ONLY audit row creation path. All callers, including transactional callers,
// must use this writer. Per-org advisory lock serializes chain extension.
export async function createAuditLog(data: {
  organizationId: string; recordId?: string | null; actionType: string; actorId: string;
  previousState?: string | null; newState?: string | null; metadata?: Record<string, unknown>;
}, transaction?: Prisma.TransactionClient) {
  const write = async (tx: Prisma.TransactionClient) => {
    // $executeRaw (not $queryRaw): pg_advisory_xact_lock returns void, which
    // Prisma cannot deserialize as a result column (P2010).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${data.organizationId}, 0))`;
    const tail = await tx.auditLog.findFirst({ where: { organizationId: data.organizationId }, orderBy: [{ timestamp: "desc" }, { id: "desc" }] });
    if (tail && !tail.hash) throw new Error("Audit chain requires backfill before new writes");
    const timestamp = new Date(Math.max(Date.now(), (tail?.timestamp.getTime() ?? 0) + 1));
    const metadata = data.metadata ? JSON.parse(JSON.stringify(data.metadata)) as Prisma.InputJsonValue : null;
    const row = { ...data, recordId: data.recordId ?? null, timestamp, metadata, prevHash: tail?.hash ?? "GENESIS" };
    return tx.auditLog.create({ data: { ...row, metadata: metadata ?? Prisma.JsonNull, hash: auditHash(row) } });
  };
  return transaction ? write(transaction) : prisma.$transaction(write);
}

export async function verifyOrganizationChain(organizationId: string) {
  const rows = await prisma.auditLog.findMany({ where: { organizationId }, orderBy: [{ timestamp: "asc" }, { id: "asc" }] });
  let prevHash = "GENESIS";
  for (const row of rows) {
    if (!row.hash || row.prevHash !== prevHash || auditHash({ ...row, prevHash }) !== row.hash) return { ok: false, brokenRowId: row.id, checked: rows.indexOf(row) };
    prevHash = row.hash;
  }
  return { ok: true, brokenRowId: null, checked: rows.length };
}

// One-off privileged maintenance; caller must requireSuperAdmin. Existing
// append-only trigger is disabled only inside a locked atomic transaction.
export async function backfillAuditChains() {
  return prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe('LOCK TABLE "audit_logs" IN ACCESS EXCLUSIVE MODE');
    if (await tx.auditLog.count({ where: { hash: { not: null } } })) throw new Error("Backfill already started/applied; refusing to rewrite chain");
    await tx.$executeRawUnsafe('ALTER TABLE "audit_logs" DISABLE TRIGGER enforce_audit_log_immutability');
    const rows = await tx.auditLog.findMany({ orderBy: [{ timestamp: "asc" }, { id: "asc" }] });
    const tails = new Map<string, string>();
    for (const row of rows) {
      const prevHash = tails.get(row.organizationId) ?? "GENESIS";
      const hash = auditHash({ ...row, prevHash });
      await tx.auditLog.update({ where: { id: row.id }, data: { prevHash, hash } });
      tails.set(row.organizationId, hash);
    }
    await tx.$executeRawUnsafe('ALTER TABLE "audit_logs" ENABLE TRIGGER enforce_audit_log_immutability');
    return rows.length;
  }, { timeout: 120_000 });
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
