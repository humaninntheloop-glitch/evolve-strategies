import { NavLinks } from "./nav-links";
import type { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  organizationName: string;
  isSuperAdmin?: boolean;
}

export function Sidebar({ role, organizationName, isSuperAdmin = false }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r bg-[var(--sidebar-bg)] border-[var(--sidebar-border)]">
      {/* Logo & Organization */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-[var(--sidebar-border)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm tracking-tight">
          H
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-on-surface">{organizationName}</h1>
          <p className="text-[10px] text-on-surface-quaternary leading-none">Human In The Loop</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks role={role} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--sidebar-border)]">
        <p className="text-[10px] font-mono text-on-surface-quaternary tracking-wider">v1.0 MVP</p>
      </div>
    </aside>
  );
}
