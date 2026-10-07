import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAuth } from "@/lib/dal/auth";
import { claimRecord, unclaimRecord } from "@/lib/actions/lifecycle-actions";
import { LifecycleBadge } from "@/components/records/lifecycle-badge";
import { RiskBadge } from "@/components/records/risk-badge";
import { formatDate } from "@/lib/utils";
import { AI_OUTPUT_IMPACT_LABELS, AI_TOOL_LABELS, DISTRIBUTION_LABELS } from "@/types";
import type { RecordWithRelations } from "@/types";
import { ArrowRight, Tray } from "@phosphor-icons/react/ssr";

interface ReviewQueueTableProps {
  records: RecordWithRelations[];
}

export async function ReviewQueueTable({ records }: ReviewQueueTableProps) {
  const user = await requireAuth();
  const approvals = await prisma.recordApproval.findMany({ where: { recordId: { in: records.filter(record => record.organizationId === user.organizationId).map(record => record.id) } }, include: { approver: { select: { fullName: true } } } });
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-elevated py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset">
          <Tray className="h-6 w-6 text-on-surface-quaternary" />
        </div>
        <p className="mt-3 text-sm font-medium text-on-surface-secondary">No authorization requests pending review</p>
        <p className="mt-1 text-xs text-on-surface-quaternary">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default bg-surface-inset">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              AI Tool
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              Submitted By
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              AI Output Impact
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              Risk
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              Submitted
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Assignment</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {records.map((record) => (
            <tr key={record.id} className="transition-colors duration-150 hover:bg-surface-inset">
              <td className="px-4 py-3.5">
                <p className="text-sm font-medium text-on-surface">
                  {record.aiToolUsed.map((t) => AI_TOOL_LABELS[t] ?? t).join(", ")}
                </p>
                {record.aiOutputImpact && (
                  <p className="mt-0.5 text-xs text-on-surface-quaternary">
                    {AI_OUTPUT_IMPACT_LABELS[record.aiOutputImpact]}
                  </p>
                )}
              </td>
              <td className="px-4 py-3.5 text-sm text-on-surface-secondary">
                {record.creator.fullName}
              </td>
              <td className="px-4 py-3.5 text-sm text-on-surface-secondary">
                {record.aiOutputImpact
                  ? AI_OUTPUT_IMPACT_LABELS[record.aiOutputImpact]
                  : record.distributionContext
                    ? DISTRIBUTION_LABELS[record.distributionContext]
                    : "—"}
              </td>
              <td className="px-4 py-3.5">
                {record.riskLevel ? (
                  <RiskBadge level={record.riskLevel} />
                ) : (
                  <span className="text-xs text-on-surface-quaternary">&mdash;</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-sm text-on-surface-tertiary whitespace-nowrap">
                {formatDate(record.submittedAt)}
              </td>
              <td className="px-4 py-3.5">
                <LifecycleBadge status={record.status} />
                <p className="mt-1 text-xs">{approvals.filter(item => item.recordId === record.id && item.decision === "APPROVED").length} of {record.riskLevel === "HIGH" ? 2 : 1} approvals</p>
                <p className="text-xs">{approvals.filter(item => item.recordId === record.id).map(item => `${item.approver.fullName}: ${item.decision}`).join(", ")}</p>
              </td>
              <td className="px-4 py-3.5 text-sm text-on-surface-secondary">
                {record.reviewerId && <p>Claimed by {record.reviewer?.fullName ?? "Reviewer"}</p>}
                {record.status === "SUBMITTED" && (user.role === "ADMIN" || user.role === "REVIEWER") && (
                  !record.reviewerId ? (
                    <form action={async () => {
                      "use server";
                      await claimRecord(record.id);
                    }}>
                      <button className="rounded-md border border-border-default px-3 py-1 hover:bg-surface-inset" type="submit">Claim</button>
                    </form>
                  ) : (record.reviewerId === user.id || user.role === "ADMIN") ? (
                    <form action={async () => {
                      "use server";
                      await unclaimRecord(record.id);
                    }}>
                      <button className="mt-1 rounded-md border border-border-default px-3 py-1 hover:bg-surface-inset" type="submit">Unclaim</button>
                    </form>
                  ) : null
                )}
              </td>
              <td className="px-4 py-3.5 text-right">
                <Link
                  href={`/permission-slips/${record.id}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Review
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
