import Link from "next/link";
import { requireAuth } from "@/lib/dal/auth";
import { getDashboardStats, getMyDashboardStats, getRecentRecords } from "@/lib/dal/records";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifecycleBadge } from "@/components/records/lifecycle-badge";
import { RiskBadge } from "@/components/records/risk-badge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  WarningCircle,
  Plus,
  ArrowRight,
  ClipboardText,
  TrendUp,
  PaperPlaneTilt,
  ShieldWarning,
  UsersThree,
  SealCheck,
  LockLaminated,
} from "@phosphor-icons/react/ssr";

export default async function DashboardPage() {
  const user = await requireAuth();

  const isAdminOrReviewer = user.role === "ADMIN" || user.role === "REVIEWER";

  const [stats, recentRecords] = await Promise.all([
    isAdminOrReviewer
      ? getDashboardStats(user.organizationId)
      : getMyDashboardStats(user.organizationId, user.id),
    getRecentRecords(user.organizationId, {
      creatorId: user.role === "EMPLOYEE" ? user.id : undefined,
      limit: 5,
    }),
  ]);

  const statCards = [
    { label: "Total Slips", value: stats.totalRecords, icon: FileText, color: "text-zinc-400 dark:text-zinc-500" },
    { label: "Pending Review", value: stats.pendingReview, icon: WarningCircle, color: "text-amber-500 dark:text-amber-400" },
    { label: "Approved", value: stats.approvedRecords, icon: CheckCircle, color: "text-blue-500 dark:text-blue-400" },
    { label: "Recorded", value: stats.recordedRecords, icon: Lock, color: "text-emerald-500 dark:text-emerald-400" },
  ];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {greeting}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-on-surface-secondary">
            {isAdminOrReviewer
              ? "Here\u2019s what\u2019s happening across your organization."
              : "Here\u2019s an overview of your AI authorization requests."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrReviewer && stats.pendingReview > 0 && (
            <Link href="/review">
              <Button variant="secondary" size="sm">
                <ClipboardText className="h-4 w-4" />
                Review ({stats.pendingReview})
              </Button>
            </Link>
          )}
          <Link href="/permission-slips/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Create AI Permission Slip
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Flow — Employee only */}
      {!isAdminOrReviewer && (
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary mb-4">
            AI Governance Workflow
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "AI Request", icon: FileText },
              { label: "Submit Request", icon: PaperPlaneTilt },
              { label: "Risk Classification", icon: ShieldWarning },
              { label: "Human Review", icon: UsersThree },
              { label: "Authorization Decision", icon: SealCheck },
              { label: "Immutable Audit Record", icon: LockLaminated },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-inset px-3 py-2">
                  <step.icon className="h-4 w-4 text-on-surface-tertiary" weight="duotone" />
                  <span className="text-sm font-medium text-on-surface whitespace-nowrap">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-on-surface-quaternary" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold tracking-tight text-on-surface">{card.value}</p>
                <p className="mt-0.5 text-[13px] text-on-surface-tertiary">{card.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-on-surface">Recent AI Permission Slips</h2>
            <Link
              href="/permission-slips"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-on-surface-tertiary transition-colors hover:text-on-surface"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="h-6 w-6 text-on-surface-quaternary" />
                <p className="mt-3 text-sm font-medium text-on-surface-secondary">No authorization requests yet</p>
                <p className="mt-1 text-xs text-on-surface-quaternary">
                  Submit your first AI authorization request to get started.
                </p>
                <Link href="/permission-slips/new" className="mt-4">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    New Authorization Request
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="divide-y divide-border-subtle p-0">
              {recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/permission-slips/${record.id}`}
                  className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-inset first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <p className="truncate text-sm font-medium text-on-surface">
                        {record.aiToolUsed}
                      </p>
                      <LifecycleBadge status={record.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-on-surface-quaternary">
                      {record.creator.fullName} &middot; {formatDate(record.updatedAt)}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    {record.riskLevel && <RiskBadge level={record.riskLevel} />}
                    <ArrowRight className="h-3.5 w-3.5 text-on-surface-quaternary opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Breakdown */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-on-surface">Status Breakdown</h2>
            <Card className="space-y-3">
              {[
                { label: "Drafts", value: stats.draftRecords, total: stats.totalRecords, color: "bg-zinc-400 dark:bg-zinc-500", dot: "bg-zinc-400 dark:bg-zinc-500" },
                { label: "Submitted", value: stats.submittedRecords, total: stats.totalRecords, color: "bg-amber-500 dark:bg-amber-400", dot: "bg-amber-500 dark:bg-amber-400" },
                { label: "Approved", value: stats.approvedRecords, total: stats.totalRecords, color: "bg-blue-500 dark:bg-blue-400", dot: "bg-blue-500 dark:bg-blue-400" },
                { label: "Rejected", value: stats.rejectedRecords, total: stats.totalRecords, color: "bg-red-500 dark:bg-red-400", dot: "bg-red-500 dark:bg-red-400" },
                { label: "Recorded", value: stats.recordedRecords, total: stats.totalRecords, color: "bg-emerald-500 dark:bg-emerald-400", dot: "bg-emerald-500 dark:bg-emerald-400" },
              ].map((item) => {
                const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-on-surface-secondary">
                        <span className={cn("h-2 w-2 rounded-full", item.dot)} />
                        {item.label}
                      </span>
                      <span className="font-medium text-on-surface tabular-nums">{item.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", item.color)}
                        style={{ width: `${Math.max(pct, item.value > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-on-surface">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/permission-slips/new" className="group block">
                <Card className="flex items-center gap-3 py-3 px-4 transition-all duration-150 hover:shadow-md hover:border-border-strong">
                  <Plus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface">New Authorization Request</p>
                    <p className="text-xs text-on-surface-quaternary">Create AI Permission Slip</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-on-surface-quaternary transition-transform group-hover:translate-x-0.5" />
                </Card>
              </Link>

              {isAdminOrReviewer && (
                <Link href="/review" className="group block">
                  <Card className="flex items-center gap-3 py-3 px-4 transition-all duration-150 hover:shadow-md hover:border-border-strong">
                    <ClipboardText className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-on-surface">AI Authorization Review</p>
                      <p className="text-xs text-on-surface-quaternary">
                        {stats.pendingReview} pending
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-on-surface-quaternary transition-transform group-hover:translate-x-0.5" />
                  </Card>
                </Link>
              )}

              {user.role === "ADMIN" && (
                <Link href="/audit-log" className="group block">
                  <Card className="flex items-center gap-3 py-3 px-4 transition-all duration-150 hover:shadow-md hover:border-border-strong">
                    <TrendUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-on-surface">Audit Log</p>
                      <p className="text-xs text-on-surface-quaternary">View all activity</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-on-surface-quaternary transition-transform group-hover:translate-x-0.5" />
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
