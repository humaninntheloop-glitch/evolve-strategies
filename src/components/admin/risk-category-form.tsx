"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createRiskCategory } from "@/lib/actions/admin-actions";
import { Plus } from "@phosphor-icons/react";

export function RiskCategoryForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createRiskCategory(formData);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-on-surface">Add Risk Category</h3>
      <form action={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            {error}
          </div>
        )}
        <Input
          id="name"
          name="name"
          label="Category Name"
          placeholder="e.g., Financial Risk"
          required
        />
        <Textarea
          id="description"
          name="description"
          label="Description"
          placeholder="Brief description of this risk category..."
          rows={2}
        />
        <Button type="submit" size="sm" disabled={loading}>
          <Plus className="h-3.5 w-3.5" />
          {loading ? "Adding..." : "Add Category"}
        </Button>
      </form>
    </Card>
  );
}
