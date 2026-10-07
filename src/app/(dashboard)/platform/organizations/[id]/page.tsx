import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/dal/auth";
import { getAllOrganizations } from "@/lib/dal/platform";
import { getUsersByOrg } from "@/lib/dal/users";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrgSettings } from "./settings";
import { OrgTeam } from "./team";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSuperAdmin();
  const { id } = await params;
  const organizations = await getAllOrganizations();
  const org = organizations.find(item => item.id === id);
  if (!org) notFound();
  const users = await getUsersByOrg(id);
  return (
    <div className="space-y-6">
      <Link href="/platform" className="text-sm underline">Back to organizations</Link>
      <header className="rounded-xl border border-border-default bg-surface-elevated p-6">
        <h1 className="text-2xl font-semibold text-on-surface">{org.name}</h1>
        <p className="mt-2 text-sm text-on-surface-secondary">Created {formatDate(org.createdAt)} · {users.length} members</p>
        {org.isDemo && <Badge variant="amber">Demo</Badge>}
      </header>
      <OrgSettings orgId={id} name={org.name} isDemo={org.isDemo} />
      <OrgTeam orgId={id} currentUserId={actor.id} users={users} organizations={organizations.map(({ id, name }) => ({ id, name }))} />
    </div>
  );
}
