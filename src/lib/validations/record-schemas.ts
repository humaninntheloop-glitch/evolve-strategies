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
  dataClassification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"], {
    message: "Data classification is required",
  }),
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
