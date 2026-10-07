"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/dal/audit-logs";
import { handleActionError } from "@/lib/errors";
import type { ActionResult } from "@/types";
import type { RiskLevel } from "@/generated/prisma";

const vendorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  type: z.string().trim().min(1, "Type is required").max(50, "Type must be under 50 characters"),
  website: z
    .string()
    .trim()
    .max(255, "Website must be under 255 characters")
    .optional()
    .transform((v) => (v ? v : null)),
  riskTier: z.enum(["LOW", "MODERATE", "HIGH"], { message: "Risk tier is required" }),
  dataHandlingNotes: z
    .string()
    .trim()
    .max(2000, "Notes must be under 2000 characters")
    .optional()
    .transform((v) => (v ? v : null)),
  toolAliases: z
    .array(z.string().trim().min(1).max(50))
    .max(20, "At most 20 aliases")
    .default([]),
});

export interface VendorListItem {
  id: string;
  name: string;
  type: string;
  website: string | null;
  riskTier: RiskLevel;
  dataHandlingNotes: string | null;
  toolAliases: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function listVendors(): Promise<ActionResult<VendorListItem[]>> {
  await requireRole("ADMIN");

  try {
    // Vendors are global reference data; every admin sees the full register.
    const vendors = await prisma.aiVendor.findMany({ orderBy: { name: "asc" } });
    return { success: true, data: vendors };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function createVendor(
  input: z.input<typeof vendorSchema>
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("ADMIN");

  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const vendor = await prisma.aiVendor.create({ data: parsed.data, select: { id: true } });
    await createAuditLog({
      organizationId: user.organizationId,
      actorId: user.id,
      actionType: "VENDOR_CREATED",
      metadata: { vendorId: vendor.id, name: parsed.data.name, riskTier: parsed.data.riskTier },
    });
    revalidatePath("/admin/vendors");
    return { success: true, data: { id: vendor.id } };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function updateVendor(
  id: string,
  input: z.input<typeof vendorSchema>
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await prisma.aiVendor.updateMany({ where: { id }, data: parsed.data });
    if (result.count === 0) {
      return { success: false, error: "Vendor not found" };
    }
    await createAuditLog({
      organizationId: user.organizationId,
      actorId: user.id,
      actionType: "VENDOR_UPDATED",
      metadata: { vendorId: id, name: parsed.data.name, riskTier: parsed.data.riskTier },
    });
    revalidatePath("/admin/vendors");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function toggleVendorActive(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  try {
    const result = await prisma.aiVendor.updateMany({ where: { id }, data: { isActive } });
    if (result.count === 0) {
      return { success: false, error: "Vendor not found" };
    }
    await createAuditLog({
      organizationId: user.organizationId,
      actorId: user.id,
      actionType: isActive ? "VENDOR_ACTIVATED" : "VENDOR_DEACTIVATED",
      metadata: { vendorId: id },
    });
    revalidatePath("/admin/vendors");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}
