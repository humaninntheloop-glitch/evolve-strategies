import { z } from "zod";

export const createRecordSchema = z
  .object({
    intendedUseDescription: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be under 2000 characters"),
    aiToolUsed: z
      .string()
      .min(1, "AI tool name is required")
      .max(200, "AI tool name must be under 200 characters"),
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
      .min(1, "Select at least one AI usage type"),
    aiUsageTypeOther: z.string().max(500).optional(),
    humanReviewPlan: z
      .array(z.string())
      .min(1, "Select at least one human review plan"),
    humanReviewPlanOther: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      !data.aiUsageType.includes("OTHER") ||
      (data.aiUsageTypeOther && data.aiUsageTypeOther.trim().length > 0),
    { message: "Please specify the other AI usage type", path: ["aiUsageTypeOther"] }
  )
  .refine(
    (data) =>
      !data.humanReviewPlan.includes("OTHER") ||
      (data.humanReviewPlanOther && data.humanReviewPlanOther.trim().length > 0),
    { message: "Please specify the other review plan", path: ["humanReviewPlanOther"] }
  );

export const updateRecordSchema = z
  .object({
    intendedUseDescription: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be under 2000 characters")
      .optional(),
    aiToolUsed: z
      .string()
      .min(1, "AI tool name is required")
      .max(200, "AI tool name must be under 200 characters")
      .optional(),
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
  })
  .refine(
    (data) =>
      !data.aiUsageType?.includes("OTHER") ||
      (data.aiUsageTypeOther && data.aiUsageTypeOther.trim().length > 0),
    { message: "Please specify the other AI usage type", path: ["aiUsageTypeOther"] }
  )
  .refine(
    (data) =>
      !data.humanReviewPlan?.includes("OTHER") ||
      (data.humanReviewPlanOther && data.humanReviewPlanOther.trim().length > 0),
    { message: "Please specify the other review plan", path: ["humanReviewPlanOther"] }
  );

export const reviewCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Review comment is required")
    .max(2000, "Comment must be under 2000 characters"),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ReviewCommentInput = z.infer<typeof reviewCommentSchema>;
