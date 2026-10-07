"use server";

import { revalidatePath } from "next/cache";
import { notifyReviewWorkflow } from "@/lib/email/review-notifications";
import { requireAuth, requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/dal/audit-logs";
import { validateTransition } from "@/lib/lifecycle/state-machine";
import { classifyRisk } from "@/lib/risk-classification";
import { generateAiSummary } from "@/lib/ai/summarize";
import { handleActionError } from "@/lib/errors";
import { rejectDecisionSchema } from "@/lib/validations/record-schemas";
import type { ActionResult, RecordStatus } from "@/types";

async function performTransition(
  recordId: string,
  targetStatus: RecordStatus,
  options?: {
    reviewComment?: string;
    decisionRationale?: string;
    decisionRationaleOther?: string;
    validationReference?: string[];
    validationReferenceOther?: string;
  }
): Promise<ActionResult> {
  const user = await requireAuth();

  const record = await prisma.record.findFirst({
    where: { id: recordId, organizationId: user.organizationId },
  });

  if (!record) {
    return { success: false, error: "Permission slip not found" };
  }

  const result = validateTransition({
    currentStatus: record.status,
    targetStatus,
    actorRole: user.role,
    actorId: user.id,
    creatorId: record.creatorId,
    reviewComment: options?.reviewComment,
    isDemo: user.isDemo,
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
      if (options?.reviewComment) {
        updateData.reviewComment = options.reviewComment;
      }
      if (options?.decisionRationale) {
        updateData.reviewerDecisionRationale = options.decisionRationale;
      }
      if (options?.decisionRationaleOther) {
        updateData.reviewerDecisionRationaleOther = options.decisionRationaleOther;
      }
      if (options?.validationReference) {
        updateData.reviewerValidationReference = options.validationReference;
      }
      if (options?.validationReferenceOther) {
        updateData.reviewerValidationReferenceOther = options.validationReferenceOther;
      }
    }
    if (targetStatus === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.reviewerId = user.id;
      updateData.reviewComment = options?.reviewComment;
      if (options?.decisionRationale) {
        updateData.reviewerDecisionRationale = options.decisionRationale;
      }
      if (options?.decisionRationaleOther) {
        updateData.reviewerDecisionRationaleOther = options.decisionRationaleOther;
      }
    }
    if (targetStatus === "RECORDED") updateData.recordedAt = new Date();
    if (targetStatus === "DRAFT") {
      // Return to draft clears review fields + AI summary
      updateData.reviewerId = null;
      updateData.claimedAt = null;
      updateData.reviewComment = null;
      updateData.rejectedAt = null;
      updateData.riskLevel = null;
      updateData.riskJustification = null;
      updateData.aiSummary = null;
      updateData.reviewerDecisionRationale = null;
      updateData.reviewerDecisionRationaleOther = null;
      updateData.reviewerValidationReference = [];
      updateData.reviewerValidationReferenceOther = null;
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
      metadata: (() => {
        const m: Record<string, unknown> = {};
        if (options?.reviewComment) m.reviewComment = options.reviewComment;
        if (options?.decisionRationale) m.decisionRationale = options.decisionRationale;
        if (options?.decisionRationaleOther) m.decisionRationaleOther = options.decisionRationaleOther;
        if (options?.validationReference?.length) m.validationReference = options.validationReference;
        if (options?.validationReferenceOther) m.validationReferenceOther = options.validationReferenceOther;
        return Object.keys(m).length > 0 ? m : undefined;
      })(),
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  if (targetStatus === "APPROVED" || targetStatus === "REJECTED") {
    await notifyReviewWorkflow(recordId, user.organizationId, targetStatus, options?.reviewComment);
  }

  revalidatePath(`/permission-slips/${recordId}`);
  revalidatePath("/permission-slips");
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
    return { success: false, error: "Permission slip not found" };
  }

  const transitionResult = validateTransition({
    currentStatus: record.status,
    targetStatus: "SUBMITTED",
    actorRole: user.role,
    actorId: user.id,
    creatorId: record.creatorId,
    isDemo: user.isDemo,
  });

  if (!transitionResult.allowed) {
    return { success: false, error: transitionResult.reason ?? "Cannot submit" };
  }

  try {
    // Deterministic risk classification using new inputs
    const riskResult = record.aiOutputImpact
      ? classifyRisk({
          aiOutputImpact: record.aiOutputImpact,
          dataSensitivity: record.dataSensitivity,
        })
      : {
          // Fallback for legacy records without aiOutputImpact
          riskLevel: "MODERATE" as const,
          justification: "Risk could not be determined — missing AI output impact. Manual review required.",
        };

    // Generate risk explanation (non-blocking — uses fallback on failure)
    const aiSummary = await generateAiSummary({
      aiToolUsed: record.aiToolUsed,
      aiOutputImpact: record.aiOutputImpact ?? "UNKNOWN",
      aiUsageType: record.aiUsageType,
      humanReviewPlan: record.humanReviewPlan,
      aiUseJustification: record.aiUseJustification,
      dataSensitivity: record.dataSensitivity,
      riskLevel: riskResult.riskLevel,
      riskJustification: riskResult.justification,
    });

    // Update record with risk classification + AI summary and submit
    await prisma.record.update({
      where: { id: recordId },
      data: {
        status: "SUBMITTED",
        reviewerId: null,
        claimedAt: null,
        submittedAt: new Date(),
        riskLevel: riskResult.riskLevel,
        riskJustification: riskResult.justification,
        aiSummary,
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

    await notifyReviewWorkflow(recordId, user.organizationId, "SUBMITTED");

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
        metadata: { autoApproved: true, reason: "Low risk - auto-authorized" },
      });

      await notifyReviewWorkflow(recordId, user.organizationId, "APPROVED", "Low risk - auto-authorized");

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

  revalidatePath(`/permission-slips/${recordId}`);
  revalidatePath("/permission-slips");
  revalidatePath("/review");
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

export async function approveRecord(
  recordId: string,
  options: {
    comment?: string;
    decisionRationale: string;
    decisionRationaleOther?: string;
    validationReference: string[];
    validationReferenceOther?: string;
  }
): Promise<ActionResult> {
  const result = await performTransition(recordId, "APPROVED", {
    reviewComment: options.comment,
    decisionRationale: options.decisionRationale,
    decisionRationaleOther: options.decisionRationaleOther,
    validationReference: options.validationReference,
    validationReferenceOther: options.validationReferenceOther,
  });

  if (!result.success) return result;

  // Auto-record after approval (no separate Finalize step)
  try {
    const user = await requireAuth();

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
      metadata: { reason: "Recorded after reviewer approval" },
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath(`/permission-slips/${recordId}`);
  revalidatePath("/permission-slips");
  revalidatePath("/review");
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

export async function finalizeRecord(recordId: string): Promise<ActionResult> {
  return performTransition(recordId, "RECORDED");
}

export async function rejectRecord(
  recordId: string,
  options: {
    comment: string;
    decisionRationale: string;
    decisionRationaleOther?: string;
  }
): Promise<ActionResult> {
  const parsed = rejectDecisionSchema.safeParse(options);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  return performTransition(recordId, "REJECTED", {
    reviewComment: parsed.data.comment,
    decisionRationale: parsed.data.decisionRationale,
    decisionRationaleOther: parsed.data.decisionRationaleOther,
  });
}

export async function claimRecord(recordId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "REVIEWER");
  try {
    const claimed = await prisma.$transaction(async (tx) => {
      const result = await tx.record.updateMany({
        where: { id: recordId, organizationId: user.organizationId, status: "SUBMITTED", reviewerId: null },
        data: { reviewerId: user.id, claimedAt: new Date() },
      });
      if (result.count !== 1) return false;
      await tx.auditLog.create({ data: {
        organizationId: user.organizationId, recordId, actorId: user.id,
        actionType: "RECORD_CLAIMED", previousState: "SUBMITTED", newState: "SUBMITTED",
      } });
      return true;
    });
    if (!claimed) return { success: false, error: "Record is unavailable or already claimed" };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
  revalidatePath("/review");
  revalidatePath(`/permission-slips/${recordId}`);
  return { success: true, data: undefined };
}

export async function unclaimRecord(recordId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "REVIEWER");
  try {
    const unclaimed = await prisma.$transaction(async (tx) => {
      const result = await tx.record.updateMany({
        where: {
          id: recordId, organizationId: user.organizationId, status: "SUBMITTED",
          reviewerId: user.role === "ADMIN" ? { not: null } : user.id,
        },
        data: { reviewerId: null, claimedAt: null },
      });
      if (result.count !== 1) return false;
      await tx.auditLog.create({ data: {
        organizationId: user.organizationId, recordId, actorId: user.id,
        actionType: "RECORD_UNCLAIMED", previousState: "SUBMITTED", newState: "SUBMITTED",
      } });
      return true;
    });
    if (!unclaimed) return { success: false, error: "Record is unavailable or cannot be unclaimed by you" };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
  revalidatePath("/review");
  revalidatePath(`/permission-slips/${recordId}`);
  return { success: true, data: undefined };
}
