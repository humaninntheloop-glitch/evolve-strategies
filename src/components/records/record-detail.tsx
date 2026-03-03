"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifecycleBadge } from "./lifecycle-badge";
import { RiskBadge } from "./risk-badge";
import { RecordTimeline } from "./record-timeline";
import { formatDate } from "@/lib/utils";
import { DISTRIBUTION_LABELS } from "@/types";
import {
  submitRecord,
  approveRecord,
  rejectRecord,
  finalizeRecord,
  returnToDraft,
} from "@/lib/actions/lifecycle-actions";
import { deleteRecord } from "@/lib/actions/record-actions";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PencilSimple, Trash, PaperPlaneTilt, CheckCircle, XCircle, Lock, ArrowCounterClockwise, DownloadSimple } from "@phosphor-icons/react";
import type { RecordWithRelations, AuditLogEntry, RecordStatus, AuthUser } from "@/types";
import { getAvailableTransitions } from "@/lib/lifecycle/state-machine";

interface RecordDetailProps {
  record: RecordWithRelations;
  auditLogs: AuditLogEntry[];
  user: AuthUser;
}

export function RecordDetail({ record, auditLogs, user }: RecordDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const availableTransitions = getAvailableTransitions(
    record.status,
    user.role,
    user.id,
    record.creatorId
  );

  const canEdit = record.status === "DRAFT" && (record.creatorId === user.id || user.role === "ADMIN");
  const canDelete = record.status === "DRAFT" && (record.creatorId === user.id || user.role === "ADMIN");

  async function handleAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(true);
    setError(null);
    const result = await action();
    if (!result.success) {
      setError(result.error ?? "Action failed");
    }
    setLoading(false);
  }

  async function handleReject() {
    if (!rejectComment.trim()) return;
    setLoading(true);
    setError(null);
    const result = await rejectRecord(record.id, rejectComment);
    if (!result.success) {
      setError(result.error ?? "Rejection failed");
    }
    setRejectDialogOpen(false);
    setRejectComment("");
    setLoading(false);
  }

  function renderActions(transition: RecordStatus) {
    switch (transition) {
      case "SUBMITTED":
        return (
          <Button
            key="submit"
            size="sm"
            disabled={loading}
            onClick={() => handleAction(() => submitRecord(record.id))}
          >
            <PaperPlaneTilt className="h-3.5 w-3.5" />
            Submit for Review
          </Button>
        );
      case "APPROVED":
        return (
          <Button
            key="approve"
            size="sm"
            disabled={loading}
            onClick={() => handleAction(() => approveRecord(record.id))}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </Button>
        );
      case "REJECTED":
        return (
          <Button
            key="reject"
            size="sm"
            variant="danger"
            disabled={loading}
            onClick={() => setRejectDialogOpen(true)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        );
      case "RECORDED":
        return (
          <Button
            key="finalize"
            size="sm"
            disabled={loading}
            onClick={() => handleAction(() => finalizeRecord(record.id))}
          >
            <Lock className="h-3.5 w-3.5" />
            Finalize
          </Button>
        );
      case "DRAFT":
        return (
          <Button
            key="return"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => handleAction(() => returnToDraft(record.id))}
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
            Return to Draft
          </Button>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-on-surface">{record.aiToolUsed}</h1>
            <LifecycleBadge status={record.status} />
            {record.riskLevel && <RiskBadge level={record.riskLevel} />}
          </div>
          <p className="mt-1.5 text-sm text-on-surface-secondary">
            Created by {record.creator.fullName} on {formatDate(record.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {record.status === "RECORDED" && (
            <a href={`/records/${record.id}/slip`} download>
              <Button size="sm" variant="secondary">
                <DownloadSimple className="h-3.5 w-3.5" />
                Download Slip
              </Button>
            </a>
          )}
          {canEdit && (
            <Link href={`/records/${record.id}/edit`}>
              <Button size="sm" variant="secondary">
                <PencilSimple className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="danger"
              disabled={loading}
              onClick={() => {
                if (confirm("Delete this draft record?")) {
                  deleteRecord(record.id);
                }
              }}
            >
              <Trash className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle>Record Details</CardTitle>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Intended Use</p>
                <p className="mt-1.5 text-sm text-on-surface-secondary whitespace-pre-wrap leading-relaxed">
                  {record.intendedUseDescription}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Tool</p>
                <p className="mt-1.5 text-sm font-medium text-on-surface">{record.aiToolUsed}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Distribution</p>
                  <p className="mt-1.5 text-sm font-medium text-on-surface">
                    {DISTRIBUTION_LABELS[record.distributionContext]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Sensitive Data</p>
                  <p className="mt-1.5 text-sm font-medium text-on-surface">
                    {record.dataSensitivity ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">High-Stakes</p>
                  <p className="mt-1.5 text-sm font-medium text-on-surface">
                    {record.highStakesDecision ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              {record.riskJustification && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Risk Assessment</p>
                  <div className="mt-1.5 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2.5">
                    <p className="text-sm text-on-surface-secondary leading-relaxed">{record.riskJustification}</p>
                  </div>
                </div>
              )}
              {record.reviewComment && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Review Comment</p>
                  <div className="mt-1.5 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2.5">
                    <p className="text-sm text-on-surface-secondary italic leading-relaxed">
                      &ldquo;{record.reviewComment}&rdquo;
                    </p>
                    {record.reviewer && (
                      <p className="mt-1.5 text-xs text-on-surface-quaternary">
                        By {record.reviewer.fullName}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          {availableTransitions.length > 0 && (
            <Card>
              <CardTitle>Actions</CardTitle>
              <div className="mt-4 flex flex-wrap gap-3">
                {availableTransitions.map((t) => renderActions(t))}
              </div>
            </Card>
          )}
        </div>

        {/* Timeline sidebar */}
        <div>
          <Card>
            <CardTitle>Activity Timeline</CardTitle>
            <div className="mt-5">
              <RecordTimeline entries={auditLogs} />
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Record</DialogTitle>
        <DialogDescription>
          Provide a reason for rejection. The creator will be able to see this comment.
        </DialogDescription>
        <div className="mt-4">
          <Textarea
            id="rejectComment"
            placeholder="Reason for rejection..."
            rows={3}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!rejectComment.trim() || loading}
            onClick={handleReject}
          >
            Reject Record
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
