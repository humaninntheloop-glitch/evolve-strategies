import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma";

export async function getUsersByOrg(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserById(id: string, organizationId: string) {
  return prisma.user.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationId: true,
      isActive: true,
    },
  });
}

export async function updateUserRole(
  id: string,
  organizationId: string,
  role: UserRole
) {
  return prisma.user.updateMany({
    where: { id, organizationId },
    data: { role },
  });
}

export async function toggleUserActive(
  id: string,
  organizationId: string,
  isActive: boolean
) {
  return prisma.user.updateMany({
    where: { id, organizationId },
    data: { isActive },
  });
}
