"use client";

import { SignOut, UserCircle } from "@phosphor-icons/react";
import { logout } from "@/lib/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/types";
import type { AuthUser } from "@/types";

interface HeaderProps {
  user: AuthUser;
}

export function Header({ user }: HeaderProps) {
  const roleBadgeVariant = {
    ADMIN: "indigo" as const,
    EMPLOYEE: "blue" as const,
    REVIEWER: "green" as const,
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-default bg-surface-elevated px-6">
      <div />
      <div className="flex items-center gap-3">
        <Badge variant={roleBadgeVariant[user.role]}>
          {ROLE_LABELS[user.role]}
        </Badge>
        <div className="h-4 w-px bg-border-default" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
            <UserCircle className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <span className="text-sm font-medium text-on-surface">{user.fullName}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-on-surface-tertiary transition-colors duration-150 hover:bg-surface-inset hover:text-on-surface"
          >
            <SignOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
