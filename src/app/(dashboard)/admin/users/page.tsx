import { requireRole } from "@/lib/dal/auth";
import { getUsersByOrg } from "@/lib/dal/users";
import { UserTable } from "@/components/admin/user-table";
import { InviteUserDialog } from "./invite-dialog";

export default async function UsersPage() {
  const user = await requireRole("ADMIN");
  const users = await getUsersByOrg(user.organizationId);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Users</h1>
          <p className="mt-1 text-sm text-on-surface-secondary">
            Manage your organization&apos;s team members
          </p>
        </div>
        <InviteUserDialog />
      </div>
      <UserTable users={users} currentUserId={user.id} />
    </div>
  );
}
