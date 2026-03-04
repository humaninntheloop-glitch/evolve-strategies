import { requireRole } from "@/lib/dal/auth";
import { getDashboardStats } from "@/lib/dal/records";
import { Card } from "@/components/ui/card";
import { OrgNameForm } from "@/components/admin/org-name-form";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const stats = await getDashboardStats(user.organizationId);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Manage your organization settings
        </p>
      </div>

      <Card className="mb-8">
        <OrgNameForm currentName={user.organizationName} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Records", value: stats.totalRecords },
          { label: "Pending Review", value: stats.pendingReview },
          { label: "Recorded", value: stats.recordedRecords },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-[13px] font-medium text-on-surface-tertiary">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-on-surface">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
