"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/dal/audit-logs";
import { validateTransition } from "@/lib/lifecycle/state-machine";
import { classifyRisk } from "@/lib/actions/ai-actions";
import { handleActionError } from "@/lib/errors";
import type { ActionResult, RecordStatus } from "@/types";

async function performTransition(
  recordId: string,
  targetStatus: RecordStatus,
  options?: { reviewComment?: string }
): Promise<ActionResult> {
  const user = await requireAuth();

  const record = await prisma.record.findFirst({
    where: { id: recordId, organizationId: user.organizationId },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  const result = validateTransition({
    currentStatus: record.status,
    targetStatus,
    actorRole: user.role,
    actorId: user.id,
    creatorId: record.creatorId,
    reviewComment: options?.reviewComment,
  });

  if (!result.allowed) {
    return { success: false, error: result.reason ?? "Transition not allowed" };
  }

  try {
    const updateData: Record<string, unknown> = {
      status: targetStatus,
    };

    if (targetStatus === "SUBMITTED") updateData.submittedAt = new Date();
    if (targetStatus === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.reviewerId = user.id;
    }
    if (targetStatus === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.reviewerId = user.id;
      updateData.reviewComment = options?.reviewComment;
    }
    if (targetStatus === "RECORDED") updateData.recordedAt = new Date();
    if (targetStatus === "DRAFT") {
      // Return to draft clears review fields
      updateData.reviewComment = null;
      updateData.rejectedAt = null;
      updateData.riskLevel = null;
      updateData.riskJustification = null;
    }

    await prisma.record.update({
      where: { id: recordId },
      data: updateData,
    });

    await createAuditLog({
      organizationId: user.organizationId,
      recordId,
      actionType: `STATUS_CHANGE`,
      actorId: user.id,
      previousState: record.status,
      newState: targetStatus,
      metadata: options?.reviewComment
        ? { reviewComment: options.reviewComment }
        : undefined,
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath(`/records/${recordId}`);
  revalidatePath("/records");
  revalidatePath("/review");
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

export async function submitRecord(recordId: string): Promise<ActionResult> {
  const user = await requireAuth();

  // First validate the transition
  const record = await prisma.record.findFirst({
    where: { id: recordId, organizationId: user.organizationId },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  const transitionResult = validateTransition({
    currentStatus: record.status,
    targetStatus: "SUBMITTED",
    actorRole: user.role,
    actorId: user.id,
    creatorId: record.creatorId,
  });

  if (!transitionResult.allowed) {
    return { success: false, error: transitionResult.reason ?? "Cannot submit" };
  }

  try {
    // Classify risk via AI
    const riskResult = await classifyRisk(
      record.intendedUseDescription,
      record.dataClassification
    );

    // Update record with risk classification and submit
    await prisma.record.update({
      where: { id: recordId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        riskLevel: riskResult.riskLevel,
        riskJustification: riskResult.justification,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      recordId,
      actionType: "STATUS_CHANGE",
      actorId: user.id,
      previousState: "DRAFT",
      newState: "SUBMITTED",
      metadata: {
        riskLevel: riskResult.riskLevel,
        riskJustification: riskResult.justification,
      },
    });

    // If LOW risk, auto-approve and auto-record
    if (riskResult.riskLevel === "LOW") {
      await prisma.record.update({
        where: { id: recordId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      await createAuditLog({
        organizationId: user.organizationId,
        recordId,
        actionType: "STATUS_CHANGE",
        actorId: user.id,
        previousState: "SUBMITTED",
        newState: "APPROVED",
        metadata: { autoApproved: true, reason: "Low risk - auto-approved" },
      });

      await prisma.record.update({
        where: { id: recordId },
        data: {
          status: "RECORDED",
          recordedAt: new Date(),
        },
      });

      await createAuditLog({
        organizationId: user.organizationId,
        recordId,
        actionType: "STATUS_CHANGE",
        actorId: user.id,
        previousState: "APPROVED",
        newState: "RECORDED",
        metadata: { autoRecorded: true, reason: "Low risk - auto-recorded" },
      });
    }
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath(`/records/${recordId}`);
  revalidatePath("/records");
  revalidatePath("/review");
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

export async function approveRecord(recordId: string): Promise<ActionResult> {
  return performTransition(recordId, "APPROVED");
}

export async function rejectRecord(
  recordId: string,
  comment: string
): Promise<ActionResult> {
  return performTransition(recordId, "REJECTED", { reviewComment: comment });
}

export async function finalizeRecord(recordId: string): Promise<ActionResult> {
  return performTransition(recordId, "RECORDED");
}

export async function returnToDraft(recordId: string): Promise<ActionResult> {
  return performTransition(recordId, "DRAFT");
}
