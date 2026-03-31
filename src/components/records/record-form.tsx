"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { createRecord, updateRecord } from "@/lib/actions/record-actions";
import { AI_USAGE_TYPE_OPTIONS, HUMAN_REVIEW_PLAN_OPTIONS, AI_USE_JUSTIFICATION_OPTIONS } from "@/types";
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
  const isEdit = !!record;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    let result;
    if (isEdit) {
      result = await updateRecord(record.id, formData);
    } else {
      result = await createRecord(formData);
    }

    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    } else if (isEdit) {
      router.push(`/permission-slips/${record.id}`);
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

          <Input
            id="aiToolUsed"
            name="aiToolUsed"
            label="AI Tool Used"
            placeholder="e.g., ChatGPT, GitHub Copilot, Claude..."
            required
            defaultValue={record?.aiToolUsed}
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
