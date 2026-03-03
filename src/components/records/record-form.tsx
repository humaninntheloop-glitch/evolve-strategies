"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createRecord, updateRecord } from "@/lib/actions/record-actions";
import type { RecordWithRelations } from "@/types";

interface RecordFormProps {
  record?: RecordWithRelations;
}

const distributionOptions = [
  { value: "INTERNAL", label: "Internal use only" },
  { value: "EXTERNAL", label: "External distribution" },
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

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

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
      router.push(`/records/${record.id}`);
    }
  }

  return (
    <Card>
      <form action={handleSubmit} className="space-y-6">
        {/* Authorization Declaration */}
        <div className="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-4 py-3">
          <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
            You are submitting this request to obtain authorization before relying on AI output in a business workflow.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <Textarea
          id="intendedUseDescription"
          name="intendedUseDescription"
          label="Intended Use Description"
          placeholder="Describe how you intend to use AI output in this workflow..."
          rows={5}
          required
          defaultValue={record?.intendedUseDescription}
        />

        <Input
          id="aiToolUsed"
          name="aiToolUsed"
          label="AI Tool Used"
          placeholder="e.g., ChatGPT, GitHub Copilot, Claude..."
          required
          defaultValue={record?.aiToolUsed}
        />

        <Select
          id="distributionContext"
          name="distributionContext"
          label="Is this AI output intended for internal use only or external distribution?"
          description="External exposure materially increases legal, regulatory, and reputational risk."
          options={distributionOptions}
          placeholder="Select distribution context"
          required
          defaultValue={record?.distributionContext}
        />

        <Select
          id="dataSensitivity"
          name="dataSensitivity"
          label="Does this AI usage involve sensitive or regulated data?"
          description="Sensitive or regulated data includes personal data, financial information, health data, confidential client data, or regulated records."
          options={booleanOptions}
          placeholder="Select an option"
          required
          defaultValue={record ? String(record.dataSensitivity) : undefined}
        />

        <Select
          id="highStakesDecision"
          name="highStakesDecision"
          label="Will this AI output influence a high-stakes decision?"
          description="High-stakes decisions include financial reporting, regulatory filings, legal determinations, clinical decisions, or binding contractual terms. When AI influences consequential decisions, authorization and accountability are required."
          options={booleanOptions}
          placeholder="Select an option"
          required
          defaultValue={record ? String(record.highStakesDecision) : undefined}
        />

        <div className="flex items-center gap-3 border-t border-border-subtle pt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Record"}
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
