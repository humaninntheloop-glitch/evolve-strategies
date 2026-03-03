"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { inviteUserSchema } from "@/lib/validations/auth-schemas";
import { handleActionError } from "@/lib/errors";
import { z } from "zod";
import type { ActionResult, UserRole } from "@/types";

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

export async function inviteUser(formData: FormData): Promise<ActionResult<string>> {
  const admin = await requireRole("ADMIN");

  const raw = {
    email: formData.get("email") as string,
    fullName: formData.get("fullName") as string,
    role: formData.get("role") as string,
  };

  const parsed = inviteUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Check if user already exists in org
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { success: false, error: "A user with this email already exists" };
  }

  try {
    const supabase = createServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;

    // Try sending an invite email first (works when SMTP is configured)
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(parsed.data.email, {
        data: { full_name: parsed.data.fullName },
        redirectTo,
      });

    let userId: string;
    let setupLink = "";

    if (!inviteError && inviteData.user) {
      // Invite email sent successfully
      userId = inviteData.user.id;
    } else {
      // Fallback: create user manually + generate a shareable link
      console.warn("Invite email failed, falling back to manual link:", inviteError?.message);

      const tempPassword = `Temp${Math.random().toString(36).slice(2)}.${Date.now()}!`;
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: parsed.data.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: parsed.data.fullName },
        });

      if (authError || !authData.user) {
        return {
          success: false,
          error: handleActionError(authError ?? new Error("Failed to create user account")),
        };
      }

      userId = authData.user.id;

      // Generate a recovery token and build a direct link to our callback
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: parsed.data.email,
        options: { redirectTo },
      });

      const hashedToken = linkData?.properties?.hashed_token;
      if (hashedToken) {
        setupLink = `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=recovery&next=/reset-password`;
      }
    }

    await prisma.user.create({
      data: {
        id: userId,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        role: parsed.data.role as UserRole,
        organizationId: admin.organizationId,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, data: setupLink };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  if (userId === admin.id) {
    return { success: false, error: "You cannot change your own role" };
  }

  try {
    await prisma.user.updateMany({
      where: { id: userId, organizationId: admin.organizationId },
      data: { role },
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  if (userId === admin.id) {
    return { success: false, error: "You cannot deactivate yourself" };
  }

  try {
    await prisma.user.updateMany({
      where: { id: userId, organizationId: admin.organizationId },
      data: { isActive },
    });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}
