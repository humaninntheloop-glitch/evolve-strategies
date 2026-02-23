import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create a demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      isDemo: true,
    },
  });

  console.log("Created organization:", org.name);

  // Create default risk categories
  const categories = [
    { name: "Data Privacy", description: "Risk related to handling personal or sensitive data" },
    { name: "Regulatory Compliance", description: "Risk related to regulatory requirements (GDPR, HIPAA, etc.)" },
    { name: "Intellectual Property", description: "Risk related to IP, trade secrets, or proprietary information" },
    { name: "Operational", description: "Risk related to business operations and decision-making" },
    { name: "Reputational", description: "Risk related to public perception and brand integrity" },
  ];

  for (const cat of categories) {
    await prisma.riskCategory.create({
      data: {
        organizationId: org.id,
        name: cat.name,
        description: cat.description,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
