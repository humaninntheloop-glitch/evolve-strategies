"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateUserRole, toggleUserActive } from "@/lib/actions/admin-actions";
import { ROLE_LABELS } from "@/types";
import type { UserRole } from "@/types";
import { UserMinus, UserCheck, WarningCircle } from "@phosphor-icons/react";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

interface UserTableProps {
  users: UserRow[];
  currentUserId: string;
}

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function UserTable({ users, currentUserId }: UserTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: string) {
    setError(null);
    setLoadingId(userId);
    const result = await updateUserRole(userId, role as UserRole);
    if (!result.success) setError(result.error);
    setLoadingId(null);
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    setError(null);
    setLoadingId(userId);
    const result = await toggleUserActive(userId, isActive);
    if (!result.success) setError(result.error);
    setLoadingId(null);
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <WarningCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default bg-surface-inset">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Name</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Email</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Role</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr key={user.id} className="transition-colors duration-150 hover:bg-surface-inset">
                <td className="px-4 py-3.5 text-sm font-medium text-on-surface">
                  {user.fullName}
                  {isSelf && <span className="ml-2 text-xs text-on-surface-quaternary">(you)</span>}
                </td>
                <td className="px-4 py-3.5 text-sm text-on-surface-secondary">{user.email}</td>
                <td className="px-4 py-3.5">
                  {isSelf ? (
                    <Badge variant="indigo">{ROLE_LABELS[user.role]}</Badge>
                  ) : (
                    <Select
                      options={roleOptions}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={loadingId === user.id}
                      className="mt-0 w-32"
                    />
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={user.isActive ? "green" : "red"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {!isSelf && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loadingId === user.id}
                      onClick={() => handleToggleActive(user.id, !user.isActive)}
                    >
                      {user.isActive ? (
                        <>
                          <UserMinus className="h-3.5 w-3.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Activate
                        </>
                      )}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
