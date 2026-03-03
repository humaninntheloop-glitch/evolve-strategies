import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  isDemo: z.boolean().default(false),
  adminEmail: z.string().email("Invalid email address"),
  adminFullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
