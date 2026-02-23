import { requireSuperAdmin } from "@/lib/dal/auth";
import { getAllOrganizations } from "@/lib/dal/platform";
import { OrganizationTable } from "@/components/platform/organization-table";
import { CreateOrgDialog } from "@/components/platform/create-org-dialog";
import { Buildings } from "@phosphor-icons/react/ssr";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  await requireSuperAdmin();
  const organizations = await getAllOrganizations();

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Buildings className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
          <div>
            <h1 className="text-lg font-semibold text-on-surface">Organizations</h1>
            <p className="text-sm text-on-surface-tertiary">
              {organizations.length} organization{organizations.length !== 1 ? "s" : ""} on the platform
            </p>
          </div>
        </div>
        <CreateOrgDialog />
      </div>

      {/* Table */}
      <OrganizationTable organizations={organizations} />
    </div>
  );
}
