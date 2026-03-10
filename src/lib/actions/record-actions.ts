"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAuth, requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/dal/audit-logs";
import { createRecordSchema, updateRecordSchema } from "@/lib/validations/record-schemas";
import { handleActionError } from "@/lib/errors";
import type { AiOutputImpact } from "@/generated/prisma";
import type { ActionResult } from "@/types";

/** Derive legacy distributionContext from aiOutputImpact for backward compat */
function deriveDistributionContext(impact: AiOutputImpact) {
  const external: AiOutputImpact[] = [
    "CLIENT_COMMUNICATION",
    "EXTERNAL_REPORTS",
    "FINANCIAL_LEGAL",
    "REGULATORY_COMPLIANCE",
  ];
  return external.includes(impact) ? "EXTERNAL" : "INTERNAL";
}

/** Derive legacy highStakesDecision from aiOutputImpact */
function deriveHighStakesDecision(impact: AiOutputImpact) {
  const highStakes: AiOutputImpact[] = ["FINANCIAL_LEGAL", "REGULATORY_COMPLIANCE"];
  return highStakes.includes(impact);
}

export async function createRecord(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();

  const raw = {
    aiToolUsed: formData.get("aiToolUsed") as string,
    aiOutputImpact: formData.get("aiOutputImpact") as string,
    dataSensitivity: formData.get("dataSensitivity") as string,
    aiUsageType: formData.getAll("aiUsageType") as string[],
    aiUsageTypeOther: (formData.get("aiUsageTypeOther") as string) || undefined,
    humanReviewPlan: formData.getAll("humanReviewPlan") as string[],
    humanReviewPlanOther: (formData.get("humanReviewPlanOther") as string) || undefined,
    aiUseJustification: formData.getAll("aiUseJustification") as string[],
    aiUseJustificationOther: (formData.get("aiUseJustificationOther") as string) || undefined,
  };

  const parsed = createRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const impact = parsed.data.aiOutputImpact as AiOutputImpact;

    const record = await prisma.record.create({
      data: {
        organizationId: user.organizationId,
        creatorId: user.id,
        aiToolUsed: parsed.data.aiToolUsed,
        aiOutputImpact: impact,
        dataSensitivity: parsed.data.dataSensitivity,
        aiUsageType: parsed.data.aiUsageType,
        aiUsageTypeOther: parsed.data.aiUsageTypeOther ?? null,
        humanReviewPlan: parsed.data.humanReviewPlan,
        humanReviewPlanOther: parsed.data.humanReviewPlanOther ?? null,
        aiUseJustification: parsed.data.aiUseJustification,
        aiUseJustificationOther: parsed.data.aiUseJustificationOther ?? null,
        // Derive legacy fields for backward compat
        distributionContext: deriveDistributionContext(impact),
        highStakesDecision: deriveHighStakesDecision(impact),
        status: "DRAFT",
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      recordId: record.id,
      actionType: "RECORD_CREATED",
      actorId: user.id,
      newState: "DRAFT",
    });

    revalidatePath("/records");
    redirect(`/records/${record.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: handleActionError(error) };
  }
}

export async function updateRecord(
  recordId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  // Find the record (tenant-scoped)
  const record = await prisma.record.findFirst({
    where: { id: recordId, organizationId: user.organizationId },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  if (record.status !== "DRAFT") {
    return { success: false, error: "Only draft records can be edited" };
  }

  if (record.creatorId !== user.id && user.role !== "ADMIN") {
    return { success: false, error: "You can only edit your own records" };
  }

  const raw = {
    aiToolUsed: formData.get("aiToolUsed") as string,
    aiOutputImpact: formData.get("aiOutputImpact") as string,
    dataSensitivity: formData.get("dataSensitivity") as string,
    aiUsageType: formData.getAll("aiUsageType") as string[],
    aiUsageTypeOther: (formData.get("aiUsageTypeOther") as string) || undefined,
    humanReviewPlan: formData.getAll("humanReviewPlan") as string[],
    humanReviewPlanOther: (formData.get("humanReviewPlanOther") as string) || undefined,
    aiUseJustification: formData.getAll("aiUseJustification") as string[],
    aiUseJustificationOther: (formData.get("aiUseJustificationOther") as string) || undefined,
  };

  const parsed = updateRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const impact = parsed.data.aiOutputImpact as AiOutputImpact | undefined;

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Derive legacy fields if aiOutputImpact changed
    if (impact) {
      updateData.distributionContext = deriveDistributionContext(impact);
      updateData.highStakesDecision = deriveHighStakesDecision(impact);
    }

    // Handle nullable fields
    updateData.aiUsageTypeOther = parsed.data.aiUsageTypeOther ?? null;
    updateData.humanReviewPlanOther = parsed.data.humanReviewPlanOther ?? null;
    updateData.aiUseJustificationOther = parsed.data.aiUseJustificationOther ?? null;

    await prisma.record.update({
      where: { id: recordId },
      data: updateData,
    });

    await createAuditLog({
      organizationId: user.organizationId,
      recordId,
      actionType: "RECORD_UPDATED",
      actorId: user.id,
      previousState: "DRAFT",
      newState: "DRAFT",
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath(`/records/${recordId}`);
  return { success: true, data: undefined };
}

export async function deleteRecord(recordId: string): Promise<ActionResult> {
  const user = await requireAuth();

  const record = await prisma.record.findFirst({
    where: { id: recordId, organizationId: user.organizationId },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  if (record.status !== "DRAFT") {
    return { success: false, error: "Only draft records can be deleted" };
  }

  if (record.creatorId !== user.id && user.role !== "ADMIN") {
    return { success: false, error: "You can only delete your own records" };
  }

  try {
    // Delete audit logs first, then the record
    await prisma.$executeRaw`DELETE FROM audit_logs WHERE record_id = ${recordId}::uuid`;
    await prisma.record.delete({ where: { id: recordId } });

    revalidatePath("/records");
    redirect("/records");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: handleActionError(error) };
  }
}
