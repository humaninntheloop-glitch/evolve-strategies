import Link from "next/link";
import { requireSuperAdmin } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  await requireSuperAdmin();
  // All application profiles, including inactive and non-demo members.
  // Supabase Auth-only accounts without a public.users profile are not listed.
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, isActive: true, isSuperAdmin: true,
      createdAt: true, organization: { select: { id: true, name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return <div className="space-y-4">
    <h1 className="text-2xl font-semibold">All Users</h1>
    <p className="text-sm text-on-surface-secondary">{users.length} application profiles across all organizations, including inactive members. Open an organization to manage its team.</p>
    <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-elevated">
      <table className="w-full text-left text-sm"><thead className="bg-surface-inset"><tr>
        {["Name", "Email", "Organization", "Role", "Status", "Super admin", "Joined"].map(title => <th key={title} className="p-3">{title}</th>)}
      </tr></thead><tbody>{users.map(user => <tr key={user.id} className="border-t border-border-subtle">
        <td className="p-3">{user.fullName}</td><td className="p-3">{user.email}</td>
        <td className="p-3"><Link className="underline" href={`/platform/organizations/${user.organization.id}`}>{user.organization.name}</Link></td>
        <td className="p-3">{user.role}</td><td className="p-3">{user.isActive ? "Active" : "Inactive"}</td>
        <td className="p-3">{user.isSuperAdmin ? "Yes" : "No"}</td><td className="p-3">{formatDate(user.createdAt)}</td>
      </tr>)}</tbody></table>
      {users.length === 0 && <p className="p-4">No profiles found.</p>}
    </div>
  </div>;
}
