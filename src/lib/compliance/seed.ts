import { prisma } from "@/lib/prisma";
import { starterFrameworks } from "./catalog";

export async function seedComplianceStarterSet() {
  await prisma.$transaction(async tx => {
    for (const framework of starterFrameworks) {
      const row = await tx.complianceFramework.upsert({ where: { key: framework.key },
        create: { key: framework.key, name: framework.name, version: framework.version },
        update: { name: framework.name, version: framework.version } });
      for (const [refCode, title, description] of framework.items) {
        await tx.frameworkRequirement.upsert({ where: { frameworkId_refCode: { frameworkId: row.id, refCode } },
          create: { frameworkId: row.id, refCode, title, description }, update: { title, description } });
      }
    }
  });
}
