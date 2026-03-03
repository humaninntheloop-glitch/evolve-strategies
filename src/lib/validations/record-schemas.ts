import { z } from "zod";

export const createRecordSchema = z.object({
  intendedUseDescription: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  aiToolUsed: z
    .string()
    .min(1, "AI tool name is required")
    .max(200, "AI tool name must be under 200 characters"),
  distributionContext: z.enum(["INTERNAL", "EXTERNAL"], {
    message: "Distribution context is required",
  }),
  dataSensitivity: z
    .enum(["true", "false"], { message: "Data sensitivity is required" })
    .transform((v) => v === "true"),
  highStakesDecision: z
    .enum(["true", "false"], { message: "High-stakes decision is required" })
    .transform((v) => v === "true"),
});

export const updateRecordSchema = createRecordSchema.partial();

export const reviewCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Review comment is required")
    .max(2000, "Comment must be under 2000 characters"),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ReviewCommentInput = z.infer<typeof reviewCommentSchema>;
