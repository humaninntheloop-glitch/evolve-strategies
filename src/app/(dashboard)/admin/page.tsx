import Link from "next/link";
import { requireRole } from "@/lib/dal/auth";
import { getDashboardStats } from "@/lib/dal/records";
import { getUsersByOrg } from "@/lib/dal/users";
import { Card } from "@/components/ui/card";
import { OrgNameForm } from "@/components/admin/org-name-form";
import { Users, ChartBar, ArrowRight } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const [stats, users] = await Promise.all([
    getDashboardStats(user.organizationId),
    getUsersByOrg(user.organizationId),
  ]);

  const adminLinks = [
    {
      href: "/admin/users",
      title: "User Management",
      description: `${users.length} users in your organization`,
      icon: Users,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      href: "/audit-log",
      title: "Audit Log",
      description: "View all system activity",
      icon: ChartBar,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Admin</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Manage your organization settings
        </p>
      </div>

      <Card className="mb-8">
        <OrgNameForm currentName={user.organizationName} />
      </Card>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Users", value: users.length },
          { label: "Total Permission Slips", value: stats.totalRecords },
          { label: "Recorded", value: stats.recordedRecords },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-[13px] font-medium text-on-surface-tertiary">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-on-surface">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="group transition-all duration-200 hover:shadow-md hover:border-border-strong">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", link.iconBg)}>
                    <Icon className={cn("h-5 w-5", link.iconColor)} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-on-surface-quaternary transition-all duration-200 group-hover:text-on-surface group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-on-surface">
                  {link.title}
                </h3>
                <p className="mt-1 text-xs text-on-surface-tertiary">{link.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
