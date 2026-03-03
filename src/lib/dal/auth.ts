import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/types";
import type { UserRole } from "@/generated/prisma";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationId: true,
      isActive: true,
      isSuperAdmin: true,
      organization: {
        select: { name: true, isDemo: true },
      },
    },
  });

  if (!dbUser || !dbUser.isActive) {
    // Auth session exists but no DB user (or inactive) — sign out to prevent
    // a redirect loop between middleware (sees session → allows dashboard)
    // and requireAuth (no DB user → redirects to login).
    await supabase.auth.signOut();
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    role: dbUser.role,
    organizationId: dbUser.organizationId,
    organizationName: dbUser.organization.name,
    isActive: dbUser.isActive,
    isSuperAdmin: dbUser.isSuperAdmin,
    isDemo: dbUser.organization.isDemo,
  };
});

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?error=no-account");
  }
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${roles.join(" or ")}`);
  }
  return user;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.isSuperAdmin) {
    throw new Error("Access denied. Platform admin privileges required.");
  }
  return user;
}
