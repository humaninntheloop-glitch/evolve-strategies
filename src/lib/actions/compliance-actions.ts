"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { handleActionError } from "@/lib/errors";
import type { ActionResult } from "@/types";

export async function setRecordRequirement(recordId: string, requirementId: string, included: boolean): Promise<ActionResult> {
  const actor = await requireRole("REVIEWER", "ADMIN");
  if (!z.string().uuid().safeParse(recordId).success || !z.string().uuid().safeParse(requirementId).success || typeof included !== "boolean") return { success: false, error: "Invalid mapping" };
  try {
    await prisma.$transaction(async tx => {
      const record = await tx.record.findFirst({ where: { id: recordId, organizationId: actor.organizationId } });
      if (!record) throw new Error("Record not found");
      const requirement = await tx.frameworkRequirement.findUnique({ where: { id: requirementId } });
      if (!requirement) throw new Error("Requirement not found");
      if (included) await tx.recordRequirement.upsert({ where: { recordId_requirementId: { recordId, requirementId } },
        create: { recordId, requirementId, mappedById: actor.id, autoMapped: false },
        update: { mappedById: actor.id, mappedAt: new Date(), autoMapped: false } });
      else await tx.recordRequirement.deleteMany({ where: { recordId, requirementId } });
      await tx.auditLog.create({ data: { organizationId: actor.organizationId, recordId, actorId: actor.id,
        actionType: included ? "REQUIREMENT_CONFIRMED" : "REQUIREMENT_REMOVED", metadata: { requirementId, refCode: requirement.refCode } } });
    });
    revalidatePath(`/permission-slips/${recordId}`);
    return { success: true, data: undefined };
  } catch (error) { return { success: false, error: handleActionError(error) }; }
}
