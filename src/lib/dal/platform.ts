import { requireSuperAdmin } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";

export async function getAllOrganizations() {
  await requireSuperAdmin();

  return prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isDemo: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          records: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDemoOrganizations() {
  await requireSuperAdmin();

  return prisma.organization.findMany({
    where: { isDemo: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getDemoUsers() {
  await requireSuperAdmin();

  return prisma.user.findMany({
    where: {
      organization: { isDemo: true },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      organization: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
