import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  isDemo: z.boolean().default(false),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
