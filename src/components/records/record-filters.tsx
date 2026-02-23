"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { STATUS_LABELS } from "@/types";
import type { RecordStatus } from "@/types";

interface RecordFiltersProps {
  users: { id: string; fullName: string }[];
  showCreatorFilter: boolean;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export function RecordFilters({ users, showCreatorFilter }: RecordFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";
  const currentCreator = searchParams.get("creator") ?? "";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/records?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/records");
  }, [router]);

  const hasFilters = currentStatus || currentCreator || currentFrom || currentTo;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Status */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
          Status
        </label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="block h-9 cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 pr-8 text-sm text-on-surface shadow-xs transition-colors duration-150 hover:border-input-border-hover focus:border-input-border-focus focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Creator (only for admins/reviewers) */}
      {showCreatorFilter && (
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
            Created By
          </label>
          <select
            value={currentCreator}
            onChange={(e) => updateFilter("creator", e.target.value)}
            className="block h-9 cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 pr-8 text-sm text-on-surface shadow-xs transition-colors duration-150 hover:border-input-border-hover focus:border-input-border-focus focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
          >
            <option value="">All people</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date From */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
          From
        </label>
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="block h-9 cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 text-sm text-on-surface shadow-xs transition-colors duration-150 hover:border-input-border-hover focus:border-input-border-focus focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
          To
        </label>
        <input
          type="date"
          value={currentTo}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="block h-9 cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 text-sm text-on-surface shadow-xs transition-colors duration-150 hover:border-input-border-hover focus:border-input-border-focus focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="h-9 cursor-pointer rounded-lg px-3 text-sm font-medium text-on-surface-secondary transition-colors hover:bg-surface-inset hover:text-on-surface"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
