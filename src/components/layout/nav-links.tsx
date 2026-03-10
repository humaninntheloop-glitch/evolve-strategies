"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  FileText,
  ClipboardText,
  Scroll,
  Users,
  GearSix,
  Buildings,
  Flask,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  section?: string;
  superAdminOnly?: boolean;
}

const links: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour, section: "Overview" },
  { href: "/records", label: "Permission Slips", icon: FileText, section: "Overview" },
  { href: "/review", label: "Review Queue", icon: ClipboardText, roles: ["REVIEWER", "ADMIN"], section: "Workflow" },
  { href: "/audit-log", label: "Audit Log", icon: Scroll, roles: ["ADMIN"], section: "Workflow" },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"], section: "Admin" },
  { href: "/admin", label: "Settings", icon: GearSix, roles: ["ADMIN"], section: "Admin" },
  { href: "/platform", label: "Organizations", icon: Buildings, section: "Platform", superAdminOnly: true },
  { href: "/platform/demo-accounts", label: "Demo Accounts", icon: Flask, section: "Platform", superAdminOnly: true },
];

interface NavLinksProps {
  role: UserRole;
  isSuperAdmin?: boolean;
}

export function NavLinks({ role, isSuperAdmin = false }: NavLinksProps) {
  const pathname = usePathname();

  const visibleLinks = links.filter((link) => {
    if (link.superAdminOnly && !isSuperAdmin) return false;
    if (link.roles && !link.roles.includes(role)) return false;
    return true;
  });

  // Group by section
  const sections: Record<string, typeof visibleLinks> = {};
  for (const link of visibleLinks) {
    const section = link.section ?? "Other";
    if (!sections[section]) sections[section] = [];
    sections[section].push(link);
  }

  return (
    <nav className="flex flex-col gap-6">
      {Object.entries(sections).map(([section, sectionLinks]) => (
        <div key={section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
            {section}
          </p>
          <div className="flex flex-col gap-0.5">
            {sectionLinks.map((link) => {
              const isActive =
                link.href === "/dashboard" || link.href === "/admin" || link.href === "/platform"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]"
                      : "text-on-surface-secondary hover:bg-[var(--sidebar-hover)] hover:text-on-surface"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-zinc-900 dark:bg-zinc-100" />
                  )}
                  <Icon weight="duotone" className={cn("h-4 w-4 shrink-0", isActive && "text-[var(--sidebar-active-text)]")} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
