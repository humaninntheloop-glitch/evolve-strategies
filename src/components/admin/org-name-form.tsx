"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOrganizationName } from "@/lib/actions/admin-actions";
import { Check } from "@phosphor-icons/react";

interface OrgNameFormProps {
  currentName: string;
}

export function OrgNameForm({ currentName }: OrgNameFormProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanged = name.trim() !== currentName;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasChanged) return;

    setLoading(true);
    setMessage(null);

    const result = await updateOrganizationName(name.trim());

    if (result.success) {
      setMessage({ type: "success", text: "Organization name updated" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error });
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label
          htmlFor="orgName"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary"
        >
          Organization Name
        </label>
        <Input
          id="orgName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          maxLength={100}
        />
      </div>
      <Button type="submit" size="sm" disabled={!hasChanged || loading}>
        {loading ? "Saving..." : (
          <>
            <Check className="h-3.5 w-3.5" />
            Save
          </>
        )}
      </Button>
      {message && (
        <p
          className={`self-center text-sm ${
            message.type === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
