import { requireRole } from "@/lib/dal/auth";
import { getAuditLogsByOrg } from "@/lib/dal/audit-logs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Scroll } from "@phosphor-icons/react/ssr";

interface AuditLogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);

  const { logs, total } = await getAuditLogsByOrg(user.organizationId, {
    page,
    pageSize: 50,
  });

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Audit Log</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Complete activity log for your organization ({total} entries)
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <Scroll className="h-8 w-8 text-on-surface-quaternary" />
            <p className="mt-2 text-sm text-on-surface-quaternary">No audit log entries yet.</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-surface-inset">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Transition
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Reviewer Rationale / Note
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Slip
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {logs.map((log) => (
                <tr key={log.id} className="transition-colors duration-150 hover:bg-surface-inset">
                  <td className="px-4 py-3.5 text-sm text-on-surface-tertiary whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="gray">{log.actionType === "STATUS_CHANGE" ? "AUTHORIZATION_EVENT" : log.actionType}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-on-surface-secondary">
                    {log.actor.fullName}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-on-surface-secondary">
                    {(() => {
                      const stateLabels: Record<string, string> = {
                        DRAFT: "Draft",
                        SUBMITTED: "Submitted",
                        APPROVED: "Authorized",
                        REJECTED: "Rejected",
                        RECORDED: "Recorded",
                      };
                      if (log.previousState && log.newState) {
                        return (
                          <span>
                            <span className="text-on-surface-quaternary">{stateLabels[log.previousState] ?? log.previousState}</span>
                            {" → "}
                            <span className="font-medium text-on-surface">{stateLabels[log.newState] ?? log.newState}</span>
                          </span>
                        );
                      }
                      return log.newState
                        ? (stateLabels[log.newState] ?? log.newState)
                        : <span className="text-on-surface-quaternary">&mdash;</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3.5 max-w-[240px]">
                    {(log.metadata as Record<string, unknown>)?.reviewComment ? (
                      <p className="text-sm text-on-surface-tertiary line-clamp-2 italic">
                        &ldquo;{String((log.metadata as Record<string, unknown>).reviewComment)}&rdquo;
                      </p>
                    ) : (
                      <span className="text-xs text-on-surface-quaternary">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/permission-slips/${log.recordId}`}
                      className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-on-surface-tertiary">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/audit-log?page=${page - 1}`}
                className="rounded-lg border border-border-default bg-surface-elevated px-3 py-1.5 text-sm font-medium text-on-surface shadow-xs transition-colors hover:bg-surface-inset"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/audit-log?page=${page + 1}`}
                className="rounded-lg border border-border-default bg-surface-elevated px-3 py-1.5 text-sm font-medium text-on-surface shadow-xs transition-colors hover:bg-surface-inset"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
