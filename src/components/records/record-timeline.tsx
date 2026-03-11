import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";
import {
  FileText,
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Lock,
  ArrowCounterClockwise,
  NotePencil,
} from "@phosphor-icons/react/ssr";

const actionIcons: Record<string, React.ElementType> = {
  RECORD_CREATED: FileText,
  RECORD_UPDATED: NotePencil,
  STATUS_CHANGE: PaperPlaneTilt,
};

function getIcon(entry: AuditLogEntry) {
  if (entry.actionType === "STATUS_CHANGE") {
    switch (entry.newState) {
      case "SUBMITTED": return PaperPlaneTilt;
      case "APPROVED": return CheckCircle;
      case "REJECTED": return XCircle;
      case "RECORDED": return Lock;
      case "DRAFT": return ArrowCounterClockwise;
    }
  }
  return actionIcons[entry.actionType] ?? FileText;
}

function getColor(entry: AuditLogEntry): { icon: string; ring: string } {
  if (entry.actionType === "STATUS_CHANGE") {
    const metadata = entry.metadata as Record<string, unknown> | null;
    if (metadata?.autoApproved) return { icon: "text-emerald-500 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" };
    if (metadata?.autoRecorded) return { icon: "text-blue-500 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-800" };
    switch (entry.newState) {
      case "SUBMITTED": return { icon: "text-amber-500 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" };
      case "APPROVED": return { icon: "text-blue-500 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-800" };
      case "REJECTED": return { icon: "text-red-500 dark:text-red-400", ring: "ring-red-200 dark:ring-red-800" };
      case "RECORDED": return { icon: "text-emerald-500 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" };
      case "DRAFT": return { icon: "text-zinc-400 dark:text-zinc-500", ring: "ring-zinc-200 dark:ring-zinc-700" };
    }
  }
  return { icon: "text-zinc-400 dark:text-zinc-500", ring: "ring-zinc-200 dark:ring-zinc-700" };
}

function getLabel(entry: AuditLogEntry): string {
  if (entry.actionType === "RECORD_CREATED") return "Permission slip created";
  if (entry.actionType === "RECORD_UPDATED") return "Permission slip updated";
  if (entry.actionType === "STATUS_CHANGE") {
    const metadata = entry.metadata as Record<string, unknown> | null;
    if (metadata?.autoApproved) return "Approved";
    if (metadata?.autoRecorded) return "Recorded";
    return `${entry.previousState} → ${entry.newState}`;
  }
  return entry.actionType;
}

interface RecordTimelineProps {
  entries: AuditLogEntry[];
}

export function RecordTimeline({ entries }: RecordTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-on-surface-quaternary">No activity yet</p>;
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => {
        const Icon = getIcon(entry);
        const color = getColor(entry);
        const isLast = i === entries.length - 1;
        return (
          <div key={entry.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-border-default" />
            )}
            <div className={cn(
              "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-elevated ring-2",
              color.ring
            )}>
              <Icon className={cn("h-3.5 w-3.5", color.icon)} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-on-surface">
                {getLabel(entry)}
              </p>
              <p className="mt-0.5 text-xs text-on-surface-quaternary">
                {entry.actor.fullName} &middot; {formatDate(entry.timestamp)}
              </p>
              {(() => {
                const meta = entry.metadata as Record<string, unknown> | null;
                if (meta?.reviewComment) {
                  return (
                    <div className="mt-2 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2">
                      <p className="text-sm text-on-surface-secondary italic">
                        &ldquo;{String(meta.reviewComment)}&rdquo;
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
