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
import {
  AI_OUTPUT_IMPACT_LABELS,
  AI_USAGE_TYPE_LABELS,
  HUMAN_REVIEW_PLAN_LABELS,
  DISTRIBUTION_LABELS,
} from "@/types";
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
import { PencilSimple, Trash, PaperPlaneTilt, CheckCircle, XCircle, Lock, ArrowCounterClockwise, DownloadSimple, CircleNotch, Sparkle } from "@phosphor-icons/react";
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
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const availableTransitions = getAvailableTransitions(
    record.status,
    user.role,
    user.id,
    record.creatorId
  );

  const canEdit = record.status === "DRAFT" && (record.creatorId === user.id || user.role === "ADMIN");
  const canDelete = record.status === "DRAFT" && (record.creatorId === user.id || user.role === "ADMIN");

  // Determine if record uses new structured fields or legacy fields
  const hasNewFields = !!record.aiOutputImpact;

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

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const result = await approveRecord(record.id, approveComment.trim() || undefined);
    if (!result.success) {
      setError(result.error ?? "Authorization failed");
    }
    setApproveDialogOpen(false);
    setApproveComment("");
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
            onClick={() => setApproveDialogOpen(true)}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Authorize AI Reliance
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
            Reject AI Reliance
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
            <Button
              size="sm"
              variant="secondary"
              disabled={isDownloading}
              onClick={async () => {
                setIsDownloading(true);
                try {
                  const res = await fetch(`/records/${record.id}/slip`);
                  if (!res.ok) throw new Error("Download failed");
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `AI-Authorization-Slip-${record.id.slice(0, 8).toUpperCase()}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  // silently fail — user can retry
                } finally {
                  setIsDownloading(false);
                }
              }}
            >
              {isDownloading ? (
                <CircleNotch className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <DownloadSimple className="h-3.5 w-3.5" />
              )}
              {isDownloading ? "Downloading..." : "Download Authorization Slip"}
            </Button>
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Tool</p>
                <p className="mt-1.5 text-sm font-medium text-on-surface">{record.aiToolUsed}</p>
              </div>

              {/* New structured fields */}
              {hasNewFields && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Output Impact</p>
                      <p className="mt-1.5 text-sm font-medium text-on-surface">
                        {record.aiOutputImpact ? AI_OUTPUT_IMPACT_LABELS[record.aiOutputImpact] : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Sensitive Data</p>
                      <p className="mt-1.5 text-sm font-medium text-on-surface">
                        {record.dataSensitivity ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {record.aiUsageType.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Usage Type</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {record.aiUsageType.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center rounded-md bg-surface-inset px-2 py-1 text-xs font-medium text-on-surface-secondary"
                          >
                            {AI_USAGE_TYPE_LABELS[type] ?? type}
                          </span>
                        ))}
                      </div>
                      {record.aiUsageTypeOther && (
                        <p className="mt-1.5 text-sm text-on-surface-tertiary italic">
                          Other: {record.aiUsageTypeOther}
                        </p>
                      )}
                    </div>
                  )}

                  {record.humanReviewPlan.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Human Review Plan</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {record.humanReviewPlan.map((plan) => (
                          <span
                            key={plan}
                            className="inline-flex items-center rounded-md bg-surface-inset px-2 py-1 text-xs font-medium text-on-surface-secondary"
                          >
                            {HUMAN_REVIEW_PLAN_LABELS[plan] ?? plan}
                          </span>
                        ))}
                      </div>
                      {record.humanReviewPlanOther && (
                        <p className="mt-1.5 text-sm text-on-surface-tertiary italic">
                          Other: {record.humanReviewPlanOther}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Legacy fields for old records */}
              {!hasNewFields && (
                <>
                  {record.aiJustification && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Justification</p>
                      <p className="mt-1.5 text-sm text-on-surface-secondary whitespace-pre-wrap leading-relaxed">
                        {record.aiJustification}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Distribution</p>
                      <p className="mt-1.5 text-sm font-medium text-on-surface">
                        {record.distributionContext ? DISTRIBUTION_LABELS[record.distributionContext] : "—"}
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
                </>
              )}

              {/* AI Summary */}
              {record.aiSummary && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Summary</p>
                  <div className="mt-1.5 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/20 px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkle className="h-3.5 w-3.5 text-brand-500" weight="fill" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Generated by AI
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-secondary leading-relaxed">
                      {record.aiSummary}
                    </p>
                  </div>
                </div>
              )}

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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Authorize AI Reliance</DialogTitle>
        <DialogDescription>
          By authorizing this record, you confirm that you have reviewed the AI usage details,
          risk classification, and human review plan. You are approving the use of AI-generated
          output in your organization&apos;s workflow under the conditions described.
        </DialogDescription>
        <div className="mt-4">
          <Textarea
            id="approveComment"
            label="Reviewer Note (optional)"
            placeholder="Add a note for the record creator..."
            rows={3}
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setApproveDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={handleApprove}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Authorize AI Reliance
          </Button>
        </div>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject AI Reliance</DialogTitle>
        <DialogDescription>
          Provide a reason for rejecting this AI usage request. The creator will be able to see
          this comment and may revise and resubmit.
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
            Reject AI Reliance
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
