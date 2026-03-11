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

const ORG_NAME = "Vizio AI Demo";
const ORG_SLUG = "vizio-ai-demo";

const USERS = [
  { email: "admin@vizio.ai", fullName: "Vizio Admin", role: "ADMIN" as const },
  { email: "review@vizio.ai", fullName: "Vizio Reviewer", role: "REVIEWER" as const },
  { email: "employee@vizio.ai", fullName: "Vizio Employee", role: "EMPLOYEE" as const },
];

const DEFAULT_PASSWORD = "Vizio2026!";

async function createAuthUser(email: string, fullName: string) {
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) {
    console.log(`  Auth user already exists: ${email} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${email}: ${error?.message}`);
  }

  console.log(`  Created auth user: ${email} (${data.user.id})`);
  return data.user.id;
}

async function main() {
  console.log(`\nCreating organization: ${ORG_NAME}\n`);

  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: {
      name: ORG_NAME,
      slug: ORG_SLUG,
      isDemo: false,
    },
  });

  console.log(`Organization ready: ${org.name} (${org.id})\n`);

  for (const u of USERS) {
    const authId = await createAuthUser(u.email, u.fullName);

    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, organizationId: org.id },
      create: {
        id: authId,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        organizationId: org.id,
      },
    });

    console.log(`  DB user ready: ${u.email} (${u.role})\n`);
  }

  console.log("Done! All 3 users created in the same organization.");
  console.log(`\nLogin credentials (all accounts):`);
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
  console.log(`  admin@vizio.ai    → ADMIN`);
  console.log(`  review@vizio.ai   → REVIEWER`);
  console.log(`  employee@vizio.ai → EMPLOYEE\n`);
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
