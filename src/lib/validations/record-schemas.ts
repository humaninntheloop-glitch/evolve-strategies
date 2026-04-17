import { z } from "zod";

export const createRecordSchema = z
  .object({
    aiToolUsed: z
      .array(z.string())
      .min(1, "Select at least one AI tool"),
    aiToolUsedOther: z.string().max(200).optional(),
    aiOutputImpact: z.enum(
      [
        "INTERNAL_NOTES",
        "INTERNAL_RESEARCH",
        "INTERNAL_DOCUMENT",
        "CLIENT_COMMUNICATION",
        "EXTERNAL_REPORTS",
        "FINANCIAL_LEGAL",
        "REGULATORY_COMPLIANCE",
      ],
      { message: "AI output impact is required" }
    ),
    dataSensitivity: z
      .enum(["true", "false"], { message: "Data sensitivity is required" })
      .transform((v) => v === "true"),
    aiUsageType: z
      .array(z.string())
      .min(1, "Select at least one AI reliance type"),
    aiUsageTypeOther: z.string().max(500).optional(),
    humanReviewPlan: z
      .array(z.string())
      .min(1, "Select at least one human review plan"),
    humanReviewPlanOther: z.string().max(500).optional(),
    aiUseJustification: z
      .array(z.string())
      .min(1, "Select at least one justification for AI use"),
    aiUseJustificationOther: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      !data.aiUsageType.includes("OTHER") ||
      (data.aiUsageTypeOther && data.aiUsageTypeOther.trim().length > 0),
    { message: "Please specify the other AI reliance type", path: ["aiUsageTypeOther"] }
  )
  .refine(
    (data) =>
      !data.humanReviewPlan.includes("OTHER") ||
      (data.humanReviewPlanOther && data.humanReviewPlanOther.trim().length > 0),
    { message: "Please specify the other review plan", path: ["humanReviewPlanOther"] }
  )
  .refine(
    (data) =>
      !data.aiUseJustification.includes("OTHER") ||
      (data.aiUseJustificationOther && data.aiUseJustificationOther.trim().length > 0),
    { message: "Please specify the other justification", path: ["aiUseJustificationOther"] }
  )
  .refine(
    (data) =>
      !data.aiToolUsed.includes("OTHER") ||
      (data.aiToolUsedOther && data.aiToolUsedOther.trim().length > 0),
    { message: "Please specify the other AI tool", path: ["aiToolUsedOther"] }
  );

export const updateRecordSchema = z
  .object({
    aiToolUsed: z.array(z.string()).optional(),
    aiToolUsedOther: z.string().max(200).optional(),
    aiOutputImpact: z
      .enum([
        "INTERNAL_NOTES",
        "INTERNAL_RESEARCH",
        "INTERNAL_DOCUMENT",
        "CLIENT_COMMUNICATION",
        "EXTERNAL_REPORTS",
        "FINANCIAL_LEGAL",
        "REGULATORY_COMPLIANCE",
      ])
      .optional(),
    dataSensitivity: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    aiUsageType: z.array(z.string()).optional(),
    aiUsageTypeOther: z.string().max(500).optional(),
    humanReviewPlan: z.array(z.string()).optional(),
    humanReviewPlanOther: z.string().max(500).optional(),
    aiUseJustification: z.array(z.string()).optional(),
    aiUseJustificationOther: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      !data.aiUsageType?.includes("OTHER") ||
      (data.aiUsageTypeOther && data.aiUsageTypeOther.trim().length > 0),
    { message: "Please specify the other AI reliance type", path: ["aiUsageTypeOther"] }
  )
  .refine(
    (data) =>
      !data.humanReviewPlan?.includes("OTHER") ||
      (data.humanReviewPlanOther && data.humanReviewPlanOther.trim().length > 0),
    { message: "Please specify the other review plan", path: ["humanReviewPlanOther"] }
  )
  .refine(
    (data) =>
      !data.aiUseJustification?.includes("OTHER") ||
      (data.aiUseJustificationOther && data.aiUseJustificationOther.trim().length > 0),
    { message: "Please specify the other justification", path: ["aiUseJustificationOther"] }
  )
  .refine(
    (data) =>
      !data.aiToolUsed?.includes("OTHER") ||
      (data.aiToolUsedOther && data.aiToolUsedOther.trim().length > 0),
    { message: "Please specify the other AI tool", path: ["aiToolUsedOther"] }
  );

export const reviewCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Review comment is required")
    .max(2000, "Comment must be under 2000 characters"),
});

export const reviewDecisionSchema = z
  .object({
    comment: z.string().max(2000).optional(),
    decisionRationale: z.string().min(1, "Please select a decision rationale"),
    decisionRationaleOther: z.string().max(500).optional(),
    validationReference: z.array(z.string()).optional(),
    validationReferenceOther: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.decisionRationale !== "OTHER" ||
      (data.decisionRationaleOther && data.decisionRationaleOther.trim().length > 0),
    { message: "Please specify the other rationale", path: ["decisionRationaleOther"] }
  )
  .refine(
    (data) =>
      !data.validationReference?.includes("OTHER") ||
      (data.validationReferenceOther && data.validationReferenceOther.trim().length > 0),
    { message: "Please specify the other validation reference", path: ["validationReferenceOther"] }
  );

export const rejectDecisionSchema = z
  .object({
    comment: z
      .string()
      .min(1, "Comment is required when rejecting")
      .max(2000, "Comment must be under 2000 characters"),
    decisionRationale: z.string().min(1, "Please select a decision rationale"),
    decisionRationaleOther: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.decisionRationale !== "OTHER" ||
      (data.decisionRationaleOther && data.decisionRationaleOther.trim().length > 0),
    { message: "Please specify the other rationale", path: ["decisionRationaleOther"] }
  );

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ReviewCommentInput = z.infer<typeof reviewCommentSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
export type RejectDecisionInput = z.infer<typeof rejectDecisionSchema>;
