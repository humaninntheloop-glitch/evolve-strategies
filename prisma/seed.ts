import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("Seeding database...");

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "vizio-ai" },
    update: {},
    create: {
      name: "Vizio AI",
      slug: "vizio-ai",
      isDemo: false,
    },
  });

  console.log("Created organization:", org.name);

  // Create super admin auth user in Supabase
  const email = "emre.bayrak@vizio.ai";
  const password = "emre.bayrak@vizio.ai";

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log("Auth user already exists:", email);
  } else {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Emre Bayrak" },
      });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    userId = authData.user.id;
    console.log("Created auth user:", email);
  }

  // Create super admin in DB
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isSuperAdmin: true, organizationId: org.id },
    create: {
      id: userId,
      email,
      fullName: "Emre Bayrak",
      role: "ADMIN",
      isSuperAdmin: true,
      organizationId: org.id,
    },
  });

  console.log("Created super admin user:", email);

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
