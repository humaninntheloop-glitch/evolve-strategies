import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LifecycleBadge } from "./lifecycle-badge";
import { RiskBadge } from "./risk-badge";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import { AI_OUTPUT_IMPACT_LABELS } from "@/types";
import type { RecordWithRelations } from "@/types";
import type { RecordStatus } from "@/types";

const statusBarColor: Record<RecordStatus, string> = {
  DRAFT: "bg-zinc-400 dark:bg-zinc-500",
  SUBMITTED: "bg-amber-500 dark:bg-amber-400",
  APPROVED: "bg-blue-500 dark:bg-blue-400",
  REJECTED: "bg-red-500 dark:bg-red-400",
  RECORDED: "bg-emerald-500 dark:bg-emerald-400",
};

interface RecordCardProps {
  record: RecordWithRelations;
}

export function RecordCard({ record }: RecordCardProps) {
  return (
    <Link href={`/records/${record.id}`} className="group block">
      <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border-strong">
        {/* Status accent bar */}
        <div className={cn("absolute inset-y-0 left-0 w-[3px]", statusBarColor[record.status])} />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-on-surface">
                {record.aiToolUsed}
              </p>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-on-surface-quaternary opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {record.aiOutputImpact && (
              <p className="mt-1 text-xs text-on-surface-tertiary">
                {AI_OUTPUT_IMPACT_LABELS[record.aiOutputImpact]}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <LifecycleBadge status={record.status} />
            {record.riskLevel && <RiskBadge level={record.riskLevel} />}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-3 text-xs text-on-surface-quaternary">
          <span className="font-medium">{record.creator.fullName}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-on-surface-quaternary" />
          <span>{formatDate(record.createdAt)}</span>
        </div>
      </Card>
    </Link>
  );
}
