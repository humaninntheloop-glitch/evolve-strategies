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

export async function getRiskCategories(organizationId: string) {
  return prisma.riskCategory.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createRiskCategory(data: {
  organizationId: string;
  name: string;
  description?: string;
}) {
  return prisma.riskCategory.create({ data });
}

export async function updateRiskCategory(
  id: string,
  organizationId: string,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  return prisma.riskCategory.updateMany({
    where: { id, organizationId },
    data,
  });
}
