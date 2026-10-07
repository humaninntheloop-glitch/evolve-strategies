"use server";
import { requireRole, requireSuperAdmin } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { canonicalJSON, verifyOrganizationChain, backfillAuditChains } from "@/lib/dal/audit-logs";

export async function verifyAuditChain() {
  const user = await requireRole("ADMIN");
  return verifyOrganizationChain(user.organizationId);
}

export async function backfillAuditChain() {
  await requireSuperAdmin();
  return backfillAuditChains();
}

export async function exportAuditCSV() {
  const user = await requireRole("ADMIN");
  // Audit screen currently has only organization scope + pagination, no other
  // filters. Export all matching org rows across pages, not just visible page.
  const rows = await prisma.auditLog.findMany({ where: { organizationId: user.organizationId },
    include: { actor: { select: { fullName: true } } }, orderBy: [{ timestamp: "desc" }, { id: "desc" }] });
  const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  return ["id,timestamp,recordId,actionType,actorId,actorName,previousState,newState,metadata,prevHash,hash",
    ...rows.map(row => [row.id,row.timestamp.toISOString(),row.recordId ?? "",row.actionType,row.actorId,row.actor.fullName,row.previousState ?? "",row.newState ?? "",canonicalJSON(row.metadata),row.prevHash ?? "",row.hash ?? ""].map(cell).join(","))].join("\r\n");
}
