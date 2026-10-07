"use server";

import { createAuditLog } from "@/lib/dal/audit-logs";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/dal/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { handleActionError } from "@/lib/errors";
import { createOrganizationSchema } from "@/lib/validations/platform-schemas";
import { sendInviteEmail } from "@/lib/email/resend";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { inviteUserSchema } from "@/lib/validations/auth-schemas";
import type { ActionResult, UserRole } from "@/types";

export async function createOrganization(
  formData: FormData
): Promise<ActionResult<string>> {
  await requireSuperAdmin();

  const raw = {
    name: formData.get("name") as string,
    isDemo: formData.get("isDemo") === "true",
    adminEmail: formData.get("adminEmail") as string,
    adminFullName: formData.get("adminFullName") as string,
  };

  const parsed = createOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Check if admin email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.adminEmail },
  });
  if (existingUser) {
    return { success: false, error: "A user with this admin email already exists" };
  }

  try {
    const slug = slugify(parsed.data.name);

    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Create org + risk categories in transaction
    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: parsed.data.name,
          slug: finalSlug,
          isDemo: parsed.data.isDemo,
        },
      });

      // Create default risk categories
      await tx.riskCategory.createMany({
        data: [
          { organizationId: newOrg.id, name: "Data Privacy", description: "Risk related to handling personal or sensitive data" },
          { organizationId: newOrg.id, name: "Regulatory Compliance", description: "Risk related to regulatory requirements" },
          { organizationId: newOrg.id, name: "Intellectual Property", description: "Risk related to IP or proprietary information" },
          { organizationId: newOrg.id, name: "Operational", description: "Risk related to business operations" },
          { organizationId: newOrg.id, name: "Reputational", description: "Risk related to public perception" },
        ],
      });

      return newOrg;
    });

    const supabase = createServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;

    const tempPassword = `Temp${Math.random().toString(36).slice(2)}.${Date.now()}!`;
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: parsed.data.adminEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: parsed.data.adminFullName },
      });

    if (authError || !authData.user) {
      return {
        success: false,
        error: handleActionError(authError ?? new Error("Failed to create admin account")),
      };
    }

    const userId = authData.user.id;

    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: parsed.data.adminEmail,
      options: { redirectTo },
    });

    const hashedToken = linkData?.properties?.hashed_token;
    const setupLink = hashedToken
      ? `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=recovery&next=/reset-password`
      : "";

    try {
      await prisma.user.create({
        data: {
          id: userId,
          email: parsed.data.adminEmail,
          fullName: parsed.data.adminFullName,
          role: "ADMIN",
          organizationId: org.id,
        },
      });
    } catch (dbError) {
      await supabase.auth.admin.deleteUser(userId);
      throw dbError;
    }

    let emailSent = false;
    if (setupLink) {
      const emailResult = await sendInviteEmail({
        to: parsed.data.adminEmail,
        fullName: parsed.data.adminFullName,
        organizationName: parsed.data.name,
        setupLink,
      });
      emailSent = emailResult.success;
    }

    revalidatePath("/platform");
    return { success: true, data: emailSent ? "" : setupLink };
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

const teamRoleSchema = z.enum(["EMPLOYEE", "REVIEWER", "ADMIN"]);
const teamIdSchema = z.string().uuid();

export async function updateOrgUserRole(orgId: string, userId: string, role: UserRole): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  if (actor.id === userId) return { success: false, error: "You cannot change your own role" };
  if (!teamIdSchema.safeParse(orgId).success || !teamIdSchema.safeParse(userId).success || !teamRoleSchema.safeParse(role).success) {
    return { success: false, error: "Invalid organization, user, or role" };
  }
  try {
    await prisma.$transaction(async tx => {
      const user = await tx.user.findFirst({ where: { id: userId, organizationId: orgId } });
      if (!user) throw new Error("User does not belong to this organization");
      const changed = await tx.user.updateMany({ where: { id: userId, organizationId: orgId }, data: { role } });
      if (changed.count !== 1) throw new Error("User organization changed; refresh and try again");
      await createAuditLog({ organizationId: orgId, actorId: actor.id, actionType: "USER_ROLE_CHANGED",
        metadata: { userId, previousRole: user.role, role } }, tx);
    });
    revalidatePath(`/platform/organizations/${orgId}`);
    return { success: true, data: undefined };
  } catch (error) { return { success: false, error: handleActionError(error) }; }
}

export async function toggleOrgUserActive(orgId: string, userId: string, isActive: boolean): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  if (actor.id === userId) return { success: false, error: "You cannot change your own active status" };
  if (!teamIdSchema.safeParse(orgId).success || !teamIdSchema.safeParse(userId).success || typeof isActive !== "boolean") {
    return { success: false, error: "Invalid organization, user, or active status" };
  }
  try {
    await prisma.$transaction(async tx => {
      const user = await tx.user.findFirst({ where: { id: userId, organizationId: orgId } });
      if (!user) throw new Error("User does not belong to this organization");
      const changed = await tx.user.updateMany({ where: { id: userId, organizationId: orgId }, data: { isActive } });
      if (changed.count !== 1) throw new Error("User organization changed; refresh and try again");
      await createAuditLog({ organizationId: orgId, actorId: actor.id, actionType: "USER_ACTIVE_CHANGED",
        metadata: { userId, previousIsActive: user.isActive, isActive } }, tx);
    });
    revalidatePath(`/platform/organizations/${orgId}`);
    return { success: true, data: undefined };
  } catch (error) { return { success: false, error: handleActionError(error) }; }
}

export async function moveUserToOrg(userId: string, targetOrgId: string): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  if (actor.id === userId) return { success: false, error: "You cannot move yourself" };
  if (!teamIdSchema.safeParse(userId).success || !teamIdSchema.safeParse(targetOrgId).success) {
    return { success: false, error: "Invalid user or organization" };
  }
  try {
    const sourceOrgId = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const target = await tx.organization.findUnique({ where: { id: targetOrgId } });
      if (!user || !target) throw new Error("User or destination organization not found");
      if (user.organizationId === targetOrgId) throw new Error("User already belongs to this organization");
      // Existing records stay in their original organization. Only the user row
      // moves; future records inherit the user's new organization.
      const changed = await tx.user.updateMany({ where: { id: userId, organizationId: user.organizationId }, data: { organizationId: targetOrgId } });
      if (changed.count !== 1) throw new Error("User organization changed; refresh and try again");
      await createAuditLog({ organizationId: user.organizationId, actorId: actor.id,
        actionType: "USER_MOVED_ORGANIZATION", metadata: { userId, sourceOrgId: user.organizationId, targetOrgId } }, tx);
      await createAuditLog({ organizationId: targetOrgId, actorId: actor.id,
        actionType: "USER_MOVED_ORGANIZATION", metadata: { userId, sourceOrgId: user.organizationId, targetOrgId } }, tx);
      return user.organizationId;
    });
    revalidatePath(`/platform/organizations/${sourceOrgId}`);
    revalidatePath(`/platform/organizations/${targetOrgId}`);
    revalidatePath("/platform");
    return { success: true, data: undefined };
  } catch (error) { return { success: false, error: handleActionError(error) }; }
}

export async function inviteUserToOrg(orgId: string, email: string, fullName: string, role: UserRole): Promise<ActionResult<string>> {
  const actor = await requireSuperAdmin();
  const parsed = inviteUserSchema.safeParse({ email: email.trim().toLowerCase(), fullName: fullName.trim(), role });
  if (!teamIdSchema.safeParse(orgId).success || !parsed.success) return { success: false, error: "Invalid organization or invitation details" };
  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return { success: false, error: "Organization not found" };
    if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) return { success: false, error: "A user with this email already exists" };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error("Site URL is not configured");
    const supabase = createServiceClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parsed.data.email, password: `Temp${randomBytes(32).toString("hex")}!`, email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });
    if (authError || !authData.user) throw authError ?? new Error("Failed to create user account");
    const userId = authData.user.id;
    let setupLink: string;
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery", email: parsed.data.email, options: { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` },
      });
      const hashedToken = linkData?.properties?.hashed_token;
      if (linkError || !hashedToken) throw linkError ?? new Error("Failed to generate password setup link");
      setupLink = `${siteUrl}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=recovery&next=/reset-password`;
      await prisma.$transaction(async tx => {
        await tx.user.create({ data: { id: userId, organizationId: orgId, ...parsed.data } });
        await createAuditLog({ organizationId: orgId, actorId: actor.id, actionType: "USER_INVITED",
          metadata: { userId, role: parsed.data.role } }, tx);
      });
    } catch (error) {
      const { error: cleanupError } = await supabase.auth.admin.deleteUser(userId);
      if (cleanupError) console.error("Failed to clean up invited auth user:", cleanupError);
      throw error;
    }
    let emailSent = false;
    try {
      emailSent = (await sendInviteEmail({ to: parsed.data.email, fullName: parsed.data.fullName,
        organizationName: org.name, setupLink })).success;
    } catch { console.error("Failed to send organization invitation"); }
    revalidatePath(`/platform/organizations/${orgId}`);
    revalidatePath("/platform");
    return { success: true, data: emailSent ? "" : setupLink };
  } catch (error) { return { success: false, error: handleActionError(error) }; }
}
