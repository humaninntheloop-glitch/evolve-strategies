import { requireSuperAdmin } from "@/lib/dal/auth";
import { getDemoUsers, getDemoOrganizations } from "@/lib/dal/platform";
import { CreateDemoAccountDialog } from "@/components/platform/create-demo-account-form";
import { DeleteDemoAccountButton } from "@/components/platform/delete-demo-account-button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/types";
import { Flask } from "@phosphor-icons/react/ssr";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DemoAccountsPage() {
  await requireSuperAdmin();
  const [users, demoOrgs] = await Promise.all([
    getDemoUsers(),
    getDemoOrganizations(),
  ]);

  const roleBadgeVariant = {
    ADMIN: "indigo" as const,
    EMPLOYEE: "blue" as const,
    REVIEWER: "green" as const,
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flask className="h-6 w-6 text-zinc-400" />
          <div>
            <h1 className="text-lg font-semibold text-on-surface">Demo Accounts</h1>
            <p className="text-sm text-on-surface-tertiary">
              {users.length} demo account{users.length !== 1 ? "s" : ""} &middot; Users can switch between all roles
            </p>
          </div>
        </div>
        <CreateDemoAccountDialog organizations={demoOrgs} />
      </div>

      {/* Table */}
      {demoOrgs.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-elevated p-8 text-center">
          <Flask className="mx-auto h-8 w-8 text-on-surface-quaternary" />
          <p className="mt-3 text-sm font-medium text-on-surface-secondary">No demo organizations</p>
          <p className="mt-1 text-xs text-on-surface-quaternary">
            Create a demo organization from the{" "}
            <a href="/platform" className="font-medium text-on-surface-secondary underline underline-offset-2 hover:text-on-surface">
              Organizations
            </a>{" "}
            page first.
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-elevated p-8 text-center">
          <Flask className="mx-auto h-8 w-8 text-on-surface-quaternary" />
          <p className="mt-3 text-sm font-medium text-on-surface-secondary">No demo accounts yet</p>
          <p className="mt-1 text-xs text-on-surface-quaternary">
            Create a demo account to let someone try the platform.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-surface-inset">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Organization</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Current Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Created</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors duration-150 hover:bg-surface-inset">
                  <td className="px-4 py-3.5 text-sm font-medium text-on-surface">
                    {user.fullName}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-on-surface-secondary font-mono">
                    {user.email}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-on-surface-secondary">
                    {user.organization.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={roleBadgeVariant[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-on-surface-tertiary">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <DeleteDemoAccountButton userId={user.id} userName={user.fullName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
