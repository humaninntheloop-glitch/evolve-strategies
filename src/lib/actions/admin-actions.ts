"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { handleActionError } from "@/lib/errors";
import { z } from "zod";
import type { ActionResult } from "@/types";

const orgNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or fewer"),
});

export async function updateOrganizationName(name: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  const parsed = orgNameSchema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.organization.update({
      where: { id: admin.organizationId },
      data: { name: parsed.data.name },
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
