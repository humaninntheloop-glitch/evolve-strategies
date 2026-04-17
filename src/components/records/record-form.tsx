"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { FileInput } from "@/components/ui/file-input";
import { Card } from "@/components/ui/card";
import { createRecord, updateRecord } from "@/lib/actions/record-actions";
import { AI_TOOL_OPTIONS, AI_USAGE_TYPE_OPTIONS, HUMAN_REVIEW_PLAN_OPTIONS, AI_USE_JUSTIFICATION_OPTIONS } from "@/types";
import type { RecordWithRelations } from "@/types";

interface RecordFormProps {
  record?: RecordWithRelations;
}

const aiOutputImpactOptions = [
  { value: "INTERNAL_NOTES", label: "Internal notes or brainstorming" },
  { value: "INTERNAL_RESEARCH", label: "Internal research or analysis" },
  { value: "INTERNAL_DOCUMENT", label: "Internal document drafting" },
  { value: "CLIENT_COMMUNICATION", label: "Customer or client communication" },
  { value: "EXTERNAL_REPORTS", label: "External reports or deliverables" },
  { value: "FINANCIAL_LEGAL", label: "Financial or legal decisions" },
  { value: "REGULATORY_COMPLIANCE", label: "Regulatory, compliance, or contractual materials" },
];

const booleanOptions = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

export function RecordForm({ record }: RecordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const isEdit = !!record;

  async function uploadFile(recordId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/records/${recordId}/attachment`, {
      method: "POST",
      body,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(data.error ?? "Upload failed");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      if (isEdit) {
        const result = await updateRecord(record.id, formData);
        if (result && !result.success) {
          setError(result.error);
          setLoading(false);
          return;
        }
        router.push(`/permission-slips/${record.id}`);
      } else {
        const result = await createRecord(formData);
        if (!result.success) {
          setError(result.error);
          setLoading(false);
          return;
        }

        // Upload pending file if one was selected
        if (pendingFile) {
          try {
            await uploadFile(result.data.id, pendingFile);
          } catch {
            // Record was created — redirect anyway, user can re-upload from edit
          }
        }

        router.push(`/permission-slips/${result.data.id}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Authorization Declaration */}
        <div className="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-4 py-3">
          <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
            You are submitting an AI authorization request. AI-generated output cannot be relied upon in any business workflow until a human reviewer explicitly authorizes reliance through this governance process.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {/* Section 1: AI Reliance Details */}
        <div className="rounded-lg border border-border-default p-5 space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Section 1 — AI Reliance Details</p>

          <CheckboxGroup
            name="aiToolUsed"
            label="AI Tool(s) Used"
            description="Select all AI tools used for this task."
            options={[...AI_TOOL_OPTIONS]}
            defaultValues={record?.aiToolUsed ?? []}
            showOther
            otherName="aiToolUsedOther"
            otherDefaultValue={record?.aiToolUsedOther ?? undefined}
          />

          <CheckboxGroup
            name="aiUsageType"
            label="How is AI being used?"
            description="Select all that apply. This helps categorize and track AI reliance patterns across the organization."
            options={[...AI_USAGE_TYPE_OPTIONS]}
            defaultValues={record?.aiUsageType ?? []}
            showOther
            otherName="aiUsageTypeOther"
            otherDefaultValue={record?.aiUsageTypeOther ?? undefined}
          />

          <RadioGroup
            name="dataSensitivity"
            label="Does this AI reliance involve sensitive or regulated data?"
            description="Sensitive or regulated data includes personal data, financial information, health data, confidential client data, or regulated data."
            options={booleanOptions}
            required
            defaultValue={record ? String(record.dataSensitivity) : undefined}
          />

          <Select
            id="aiOutputImpact"
            name="aiOutputImpact"
            label="AI Output Description / Workflow Type"
            description="This determines the risk level. External-facing or consequential outputs require reviewer authorization."
            options={aiOutputImpactOptions}
            placeholder="Select AI output impact"
            required
            defaultValue={record?.aiOutputImpact ?? undefined}
          />
        </div>

        {/* Section 2: AI Use Justification */}
        <div className="rounded-lg border border-border-default p-5 space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Section 2 — AI Use Justification</p>

          <RadioGroup
            name="aiUseJustification"
            label="Why is AI appropriate for this task?"
            description="Select the primary justification for using AI in this workflow."
            options={[...AI_USE_JUSTIFICATION_OPTIONS]}
            defaultValue={record?.aiUseJustification?.[0] ?? undefined}
            showOther
            otherName="aiUseJustificationOther"
            otherDefaultValue={record?.aiUseJustificationOther ?? undefined}
          />
        </div>

        {/* Section 3: Human Oversight */}
        <div className="rounded-lg border border-border-default p-5 space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Section 3 — Human Oversight</p>

          <CheckboxGroup
            name="humanReviewPlan"
            label="Human Oversight Plan"
            description="Select all review methods you plan to apply. At least one human review step is required."
            options={[...HUMAN_REVIEW_PLAN_OPTIONS]}
            defaultValues={record?.humanReviewPlan ?? []}
            showOther
            otherName="humanReviewPlanOther"
            otherDefaultValue={record?.humanReviewPlanOther ?? undefined}
          />
        </div>

        {/* Section 4: Supporting Documents */}
        <div className="rounded-lg border border-border-default p-5 space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Section 4 — Supporting Documents</p>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Attachment
              <span className="ml-1 text-xs font-normal text-on-surface-tertiary">(optional)</span>
            </label>
            <p className="mb-1.5 text-xs text-on-surface-tertiary">
              Attach a supporting document such as the AI output, source material, or relevant evidence.
            </p>
            {isEdit ? (
              <FileInput
                recordId={record.id}
                existingFile={
                  record.attachmentName
                    ? { name: record.attachmentName, size: record.attachmentSize ?? 0 }
                    : null
                }
              />
            ) : (
              <FilePicker value={pendingFile} onChange={setPendingFile} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border-subtle pt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Submit AI Authorization Request"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Inline file picker for create mode (no upload, just selects a file) ──
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePicker({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File type not supported. Use PDF, Word, Excel, images, or text files.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    onChange(file);
  }

  if (value) {
    return (
      <div>
        <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-inset px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-on-surface-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-on-surface truncate">{value.name}</p>
            <p className="text-xs text-on-surface-tertiary">{formatFileSize(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/20"
            : "border-border-default hover:border-input-border-hover bg-surface-inset"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <svg className="h-6 w-6 text-on-surface-quaternary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-on-surface-secondary">
          <span className="font-medium text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-on-surface-quaternary">
          PDF, Word, Excel, images, or text (max 10 MB)
        </p>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
