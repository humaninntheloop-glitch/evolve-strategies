"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifecycleBadge } from "./lifecycle-badge";
import { RiskBadge } from "./risk-badge";
import { RecordTimeline } from "./record-timeline";
import { formatDate, cn } from "@/lib/utils";
import {
  AI_TOOL_LABELS,
  AI_OUTPUT_IMPACT_LABELS,
  AI_USAGE_TYPE_LABELS,
  HUMAN_REVIEW_PLAN_LABELS,
  AI_USE_JUSTIFICATION_LABELS,
  REVIEWER_DECISION_RATIONALE_OPTIONS,
  REJECT_DECISION_RATIONALE_OPTIONS,
  DECISION_RATIONALE_LABELS,
  REVIEWER_VALIDATION_REFERENCE_OPTIONS,
  REVIEWER_VALIDATION_REFERENCE_LABELS,
  DISTRIBUTION_LABELS,
} from "@/types";
import {
  submitRecord,
  approveRecord,
  rejectRecord,
  finalizeRecord,
} from "@/lib/actions/lifecycle-actions";
import { deleteRecord } from "@/lib/actions/record-actions";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup } from "@/components/ui/radio-group";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { PencilSimple, Trash, PaperPlaneTilt, CheckCircle, XCircle, DownloadSimple, CircleNotch, Sparkle, ShieldCheck, ShieldSlash, Lock } from "@phosphor-icons/react";
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
  const [approveRationale, setApproveRationale] = useState("");
  const [approveRationaleOther, setApproveRationaleOther] = useState("");
  const [approveValidationRef, setApproveValidationRef] = useState<string[]>([]);
  const [approveValidationRefOther, setApproveValidationRefOther] = useState("");
  const [rejectRationale, setRejectRationale] = useState("");
  const [rejectRationaleOther, setRejectRationaleOther] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  const availableTransitions = getAvailableTransitions(
    record.status,
    user.role,
    user.id,
    record.creatorId,
    user.isDemo
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
    if (!rejectComment.trim() || !rejectRationale) return;
    setLoading(true);
    setError(null);
    const result = await rejectRecord(record.id, {
      comment: rejectComment,
      decisionRationale: rejectRationale,
      decisionRationaleOther: rejectRationale === "OTHER" ? rejectRationaleOther : undefined,
    });
    if (!result.success) {
      setError(result.error ?? "Rejection failed");
    }
    setRejectDialogOpen(false);
    setRejectComment("");
    setRejectRationale("");
    setRejectRationaleOther("");
    setLoading(false);
  }

  async function handleApprove() {
    if (!approveRationale) return;
    setLoading(true);
    setError(null);
    const result = await approveRecord(record.id, {
      comment: approveComment.trim() || undefined,
      decisionRationale: approveRationale,
      decisionRationaleOther: approveRationale === "OTHER" ? approveRationaleOther : undefined,
      validationReference: approveValidationRef,
      validationReferenceOther: approveValidationRef.includes("OTHER") ? approveValidationRefOther : undefined,
    });
    if (!result.success) {
      setError(result.error ?? "Authorization failed");
    }
    setApproveDialogOpen(false);
    setApproveComment("");
    setApproveRationale("");
    setApproveRationaleOther("");
    setApproveValidationRef([]);
    setApproveValidationRefOther("");
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
            Submit AI Authorization Request
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
            Finalize Record
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
            <h1 className="text-xl font-bold tracking-tight text-on-surface">
              {record.aiToolUsed.length > 0
                ? record.aiToolUsed.map((t) => AI_TOOL_LABELS[t] ?? t).join(", ")
                : "AI Reliance Record"}
            </h1>
            <LifecycleBadge status={record.status} />
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
                  const res = await fetch(`/permission-slips/${record.id}/slip`);
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
            <Link href={`/permission-slips/${record.id}/edit`}>
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
                if (confirm("Delete this draft permission slip?")) {
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

      {/* Risk Level Banner */}
      {record.riskLevel && (
        <Card className={cn(
          "border-l-4",
          record.riskLevel === "LOW" && "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
          record.riskLevel === "MODERATE" && "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
          record.riskLevel === "HIGH" && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        )}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Risk Explanation</p>
          <p className={cn(
            "mt-1 text-lg font-bold",
            record.riskLevel === "LOW" && "text-emerald-700 dark:text-emerald-400",
            record.riskLevel === "MODERATE" && "text-amber-700 dark:text-amber-400",
            record.riskLevel === "HIGH" && "text-red-700 dark:text-red-400",
          )}>
            {record.riskLevel === "LOW" ? "Low Risk" : record.riskLevel === "MODERATE" ? "Moderate Risk" : "High Risk"}
          </p>
          {record.riskJustification && (
            <p className="mt-1.5 text-sm text-on-surface-secondary leading-relaxed">{record.riskJustification}</p>
          )}
        </Card>
      )}

      {/* Actions — elevated above detail so reviewers can decide without scrolling */}
      {availableTransitions.length > 0 && (
        <Card>
          <CardTitle>Actions</CardTitle>
          <div className="mt-4 flex flex-wrap gap-3">
            {availableTransitions.map((t) => renderActions(t))}
          </div>
        </Card>
      )}

      {/* AI Summary / Risk Explanation */}
      {record.aiSummary && (
        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkle className="h-3.5 w-3.5 text-brand-500" weight="fill" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Risk Explanation
            </span>
          </div>
          <ul className="space-y-2">
            {record.aiSummary.split(/(?:\.\s+|\n+)/).filter((s: string) => s.trim()).map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-on-surface-secondary leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface-quaternary" />
                {point.trim().replace(/\.$/, "")}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Authorization Source of Truth */}
          {(record.status === "APPROVED" || record.status === "RECORDED") && (
            <Card>
              {/* Banner */}
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" weight="fill" />
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Keep
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Authorized By</p>
                    <p className="mt-1.5 text-sm font-medium text-on-surface">
                      {record.reviewer?.fullName ?? "Auto-authorized (Low Risk)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Authorization Date</p>
                    <p className="mt-1.5 text-sm font-medium text-on-surface">
                      {formatDate(record.approvedAt)}
                    </p>
                  </div>
                </div>

                {record.reviewerDecisionRationale ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Decision Rationale</p>
                    <p className="mt-1.5 text-sm text-on-surface-secondary">
                      {DECISION_RATIONALE_LABELS[record.reviewerDecisionRationale] ?? record.reviewerDecisionRationale}
                    </p>
                    {record.reviewerDecisionRationaleOther && (
                      <p className="mt-1 text-sm text-on-surface-tertiary italic">
                        {record.reviewerDecisionRationaleOther}
                      </p>
                    )}
                  </div>
                ) : !record.reviewer && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Decision Rationale</p>
                    <p className="mt-1.5 text-sm text-on-surface-tertiary italic">
                      Auto-authorized — Low risk classification
                    </p>
                  </div>
                )}

                {record.reviewerValidationReference.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Validation Reference</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {record.reviewerValidationReference.map((ref) => (
                        <span
                          key={ref}
                          className="inline-flex items-center rounded-md bg-surface-inset px-2 py-1 text-xs font-medium text-on-surface-secondary"
                        >
                          {REVIEWER_VALIDATION_REFERENCE_LABELS[ref] ?? ref}
                        </span>
                      ))}
                    </div>
                    {record.reviewerValidationReferenceOther && (
                      <p className="mt-1.5 text-sm text-on-surface-tertiary italic">
                        Other: {record.reviewerValidationReferenceOther}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardTitle>AI Permission Slip</CardTitle>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Tool(s)</p>
                <p className="mt-1.5 text-sm font-medium text-on-surface">
                  {record.aiToolUsed.map((t) => AI_TOOL_LABELS[t] ?? t).join(", ")}
                  {record.aiToolUsedOther && (
                    <span className="text-on-surface-secondary font-normal"> — {record.aiToolUsedOther}</span>
                  )}
                </p>
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
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">AI Reliance Type</p>
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
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-secondary">Human Oversight Plan</p>
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

                  {record.aiUseJustification.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-secondary">AI Use Justification</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {record.aiUseJustification.map((j) => (
                          <span
                            key={j}
                            className="inline-flex items-center rounded-md bg-surface-inset px-2 py-1 text-xs font-medium text-on-surface-secondary"
                          >
                            {AI_USE_JUSTIFICATION_LABELS[j] ?? j}
                          </span>
                        ))}
                      </div>
                      {record.aiUseJustificationOther && (
                        <p className="mt-1.5 text-sm text-on-surface-tertiary italic">
                          Other: {record.aiUseJustificationOther}
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

              {record.attachmentName && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Supporting Document</p>
                  <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2.5">
                    <svg className="h-4 w-4 shrink-0 text-on-surface-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-on-surface truncate">{record.attachmentName}</p>
                      {record.attachmentSize && (
                        <p className="text-xs text-on-surface-tertiary">
                          {record.attachmentSize < 1024 * 1024
                            ? `${(record.attachmentSize / 1024).toFixed(1)} KB`
                            : `${(record.attachmentSize / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      )}
                    </div>
                    <a
                      href={`/api/records/${record.id}/attachment`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                    >
                      Download
                    </a>
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

          {/* Rejected banner */}
          {record.status === "REJECTED" && record.reviewerDecisionRationale && (
            <Card>
              <div className="flex items-center gap-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                <ShieldSlash className="h-5 w-5 text-red-600 dark:text-red-400" weight="fill" />
                <span className="text-sm font-semibold text-red-800 dark:text-red-300">
                  AI Reliance Not Authorized
                </span>
              </div>
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Decision Rationale</p>
                <p className="mt-1.5 text-sm text-on-surface-secondary">
                  {DECISION_RATIONALE_LABELS[record.reviewerDecisionRationale] ?? record.reviewerDecisionRationale}
                </p>
                {record.reviewerDecisionRationaleOther && (
                  <p className="mt-1 text-sm text-on-surface-tertiary italic">
                    {record.reviewerDecisionRationaleOther}
                  </p>
                )}
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
          You are authorizing reliance on AI-assisted output in this workflow. Please confirm that
          appropriate human oversight and validation has occurred before granting this authorization.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          <RadioGroup
            label="Decision Rationale"
            description="Why are you authorizing this AI reliance?"
            required
            options={[...REVIEWER_DECISION_RATIONALE_OPTIONS]}
            value={approveRationale}
            onChange={setApproveRationale}
            showOther
            otherValue={approveRationaleOther}
            onOtherChange={setApproveRationaleOther}
          />
          <CheckboxGroup
            name="approveValidationRef"
            label="Validation Reference"
            description="What was the AI output reviewed against before authorizing reliance?"
            required
            options={[...REVIEWER_VALIDATION_REFERENCE_OPTIONS]}
            values={approveValidationRef}
            onChange={setApproveValidationRef}
            showOther
            otherValue={approveValidationRefOther}
            onOtherChange={setApproveValidationRefOther}
          />
          <Textarea
            id="approveComment"
            label={record.riskLevel === "HIGH" ? "Reviewer Note (required)" : "Reviewer Note (optional)"}
            placeholder="Add a note for the requestor..."
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
            disabled={!approveRationale || approveValidationRef.length === 0 || (record.riskLevel === "HIGH" && !approveComment.trim()) || loading}
            onClick={() => setConfirmApproveOpen(true)}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Confirm AI Authorization
          </Button>
        </div>
      </Dialog>

      {/* Confirm Authorization Dialog */}
      <Dialog open={confirmApproveOpen} onClose={() => setConfirmApproveOpen(false)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" weight="fill" />
          </div>
          <div>
            <DialogTitle>Confirm AI Authorization</DialogTitle>
            <DialogDescription>
              You are authorizing reliance on AI-generated output for this workflow. Please confirm that appropriate human review and validation has occurred.
            </DialogDescription>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmApproveOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              setConfirmApproveOpen(false);
              handleApprove();
            }}
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
          Provide a reason for rejecting this AI reliance request. The requestor will see this
          feedback and may revise and resubmit.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          <RadioGroup
            label="Decision Rationale"
            description="Why are you rejecting this AI reliance?"
            required
            options={[...REJECT_DECISION_RATIONALE_OPTIONS]}
            value={rejectRationale}
            onChange={setRejectRationale}
            showOther
            otherValue={rejectRationaleOther}
            onOtherChange={setRejectRationaleOther}
          />
          <Textarea
            id="rejectComment"
            label="Comment (required)"
            placeholder="Explain why this AI reliance is being rejected..."
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
            disabled={!rejectRationale || !rejectComment.trim() || loading}
            onClick={handleReject}
          >
            Reject AI Reliance
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
