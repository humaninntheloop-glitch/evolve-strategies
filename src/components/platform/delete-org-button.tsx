"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { deleteOrganization } from "@/lib/actions/platform-actions";

interface DeleteOrgButtonProps {
  organizationId: string;
  organizationName: string;
}

export function DeleteOrgButton({ organizationId, organizationName }: DeleteOrgButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete demo organization "${organizationName}" and all its users?`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteOrganization(organizationId);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-md p-1.5 text-on-surface-quaternary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash className="h-4 w-4" />
      </button>
    </div>
  );
}
