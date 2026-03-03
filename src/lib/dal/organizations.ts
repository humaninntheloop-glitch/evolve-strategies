import { prisma } from "@/lib/prisma";

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
    },
  });
}
