"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/dal/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { handleActionError } from "@/lib/errors";
import { createOrganizationSchema } from "@/lib/validations/platform-schemas";
import type { ActionResult } from "@/types";

export async function createOrganization(
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();

  const raw = {
    name: formData.get("name") as string,
    isDemo: formData.get("isDemo") === "true",
  };

  const parsed = createOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const slug = slugify(parsed.data.name);

    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: parsed.data.name,
          slug: finalSlug,
          isDemo: parsed.data.isDemo,
        },
      });

      // Create default risk categories
      await tx.riskCategory.createMany({
        data: [
          { organizationId: org.id, name: "Data Privacy", description: "Risk related to handling personal or sensitive data" },
          { organizationId: org.id, name: "Regulatory Compliance", description: "Risk related to regulatory requirements" },
          { organizationId: org.id, name: "Intellectual Property", description: "Risk related to IP or proprietary information" },
          { organizationId: org.id, name: "Operational", description: "Risk related to business operations" },
          { organizationId: org.id, name: "Reputational", description: "Risk related to public perception" },
        ],
      });
    });

    revalidatePath("/platform");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function createDemoAccount(
  organizationId: string
): Promise<ActionResult<{ email: string; password: string }>> {
  await requireSuperAdmin();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, slug: true, isDemo: true },
  });

  if (!org) {
    return { success: false, error: "Organization not found" };
  }

  if (!org.isDemo) {
    return { success: false, error: "Can only create demo accounts in demo organizations" };
  }

  try {
    const count = await prisma.user.count({ where: { organizationId } });
    const num = count + 1;
    const email = `demo${num}@${org.slug}.demo`;
    const fullName = `Demo User ${num}`;
    const password = `Demo${Math.random().toString(36).slice(2, 8)}!${num}`;

    const supabase = createServiceClient();
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (authError || !authData.user) {
      return {
        success: false,
        error: handleActionError(authError ?? new Error("Failed to create auth account")),
      };
    }

    await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        fullName,
        role: "EMPLOYEE",
        organizationId,
      },
    });

    revalidatePath("/platform/demo-accounts");
    return { success: true, data: { email, password } };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function deleteDemoAccount(
  userId: string
): Promise<ActionResult> {
  await requireSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, organization: { select: { isDemo: true } } },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (!user.organization.isDemo) {
    return { success: false, error: "Can only delete demo accounts" };
  }

  try {
    const supabase = createServiceClient();
    await supabase.auth.admin.deleteUser(userId);
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/platform/demo-accounts");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function deleteOrganization(
  organizationId: string
): Promise<ActionResult> {
  await requireSuperAdmin();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, isDemo: true, _count: { select: { users: true, records: true } } },
  });

  if (!org) {
    return { success: false, error: "Organization not found" };
  }

  if (!org.isDemo) {
    return { success: false, error: "Can only delete demo organizations" };
  }

  if (org._count.records > 0) {
    return { success: false, error: "Cannot delete organization with existing records. Delete records first." };
  }

  try {
    const supabase = createServiceClient();

    // Delete all users in the org from Supabase auth + DB
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    for (const user of users) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    // Cascade: users, risk categories, then org
    await prisma.$transaction(async (tx) => {
      await tx.user.deleteMany({ where: { organizationId } });
      await tx.riskCategory.deleteMany({ where: { organizationId } });
      await tx.organization.delete({ where: { id: organizationId } });
    });

    revalidatePath("/platform");
    revalidatePath("/platform/demo-accounts");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function toggleSuperAdmin(
  userId: string,
  isSuperAdmin: boolean
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();

  if (userId === admin.id) {
    return { success: false, error: "You cannot modify your own superadmin status" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin },
    });

    revalidatePath("/platform/demo-accounts");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}
