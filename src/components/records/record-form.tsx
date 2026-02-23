"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createRecord, updateRecord } from "@/lib/actions/record-actions";
import { CLASSIFICATION_LABELS } from "@/types";
import type { RecordWithRelations } from "@/types";

interface RecordFormProps {
  record?: RecordWithRelations;
}

const classificationOptions = Object.entries(CLASSIFICATION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

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
          id="dataClassification"
          name="dataClassification"
          label="Data Classification"
          options={classificationOptions}
          placeholder="Select classification..."
          required
          defaultValue={record?.dataClassification}
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
