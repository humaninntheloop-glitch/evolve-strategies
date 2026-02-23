"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { handleActionError } from "@/lib/errors";
import type { ActionResult, UserRole } from "@/types";

const VALID_ROLES: UserRole[] = ["EMPLOYEE", "REVIEWER", "ADMIN"];

export async function switchRole(role: UserRole): Promise<ActionResult> {
  const user = await requireAuth();

  if (!user.isSuperAdmin && !user.isDemo) {
    return { success: false, error: "Role switching is only available in demo mode" };
  }

  if (!VALID_ROLES.includes(role)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { role },
    });

    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}
