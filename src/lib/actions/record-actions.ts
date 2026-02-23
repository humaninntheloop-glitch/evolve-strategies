"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAuth, requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/dal/audit-logs";
import { createRecordSchema, updateRecordSchema } from "@/lib/validations/record-schemas";
import { handleActionError } from "@/lib/errors";
import type { ActionResult } from "@/types";

export async function createRecord(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();

  const raw = {
    intendedUseDescription: formData.get("intendedUseDescription") as string,
    aiToolUsed: formData.get("aiToolUsed") as string,
    dataClassification: formData.get("dataClassification") as string,
  };

  const parsed = createRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const record = await prisma.record.create({
      data: {
        organizationId: user.organizationId,
        creatorId: user.id,
        intendedUseDescription: parsed.data.intendedUseDescription,
        aiToolUsed: parsed.data.aiToolUsed,
        dataClassification: parsed.data.dataClassification,
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
    intendedUseDescription: formData.get("intendedUseDescription") as string,
    aiToolUsed: formData.get("aiToolUsed") as string,
    dataClassification: formData.get("dataClassification") as string,
  };

  const parsed = updateRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.record.update({
      where: { id: recordId },
      data: parsed.data,
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
