import Image from "next/image";
import Link from "next/link";
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
      <Link href="/dashboard" className="flex items-center gap-3 px-5 h-14 border-b border-[var(--sidebar-border)] transition-colors hover:bg-[var(--sidebar-hover)]">
        <Image
          src="/logo-icon.png"
          alt="Human In The Loop"
          width={32}
          height={32}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-on-surface">{organizationName}</h1>
          <p className="text-[10px] text-on-surface-quaternary leading-none">Human In The Loop</p>
        </div>
      </Link>

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
