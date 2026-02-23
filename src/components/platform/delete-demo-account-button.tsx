"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { deleteDemoAccount } from "@/lib/actions/platform-actions";

interface DeleteDemoAccountButtonProps {
  userId: string;
  userName: string;
}

export function DeleteDemoAccountButton({ userId, userName }: DeleteDemoAccountButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete demo account "${userName}"?`)) return;
    setLoading(true);
    await deleteDemoAccount(userId);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md p-1.5 text-on-surface-quaternary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash className="h-4 w-4" />
    </button>
  );
}
