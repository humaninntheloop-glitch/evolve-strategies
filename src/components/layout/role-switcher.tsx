"use client";

import { useState, useRef, useEffect } from "react";
import { Flask, CaretDown, Check } from "@phosphor-icons/react";
import { switchRole } from "@/lib/actions/demo-actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface RoleSwitcherProps {
  currentRole: UserRole;
}

const roles: { value: UserRole; label: string; variant: string }[] = [
  { value: "EMPLOYEE", label: "Employee", variant: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" },
  { value: "REVIEWER", label: "Reviewer", variant: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { value: "ADMIN", label: "Admin", variant: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" },
];

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = roles.find((r) => r.value === currentRole)!;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(role: UserRole) {
    if (role === currentRole) {
      setOpen(false);
      return;
    }
    setLoading(true);
    await switchRole(role);
    setOpen(false);
    setLoading(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium transition-all duration-150",
          current.variant,
          "hover:opacity-80 disabled:opacity-60"
        )}
      >
        <Flask className="h-3 w-3" />
        {current.label}
        <CaretDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-border-default bg-surface-elevated shadow-lg animate-scale-in">
          <div className="px-3 py-2 border-b border-border-subtle">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              Switch Role
            </p>
          </div>
          <div className="p-1">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleSelect(role.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-100",
                  role.value === currentRole
                    ? "bg-surface-inset text-on-surface"
                    : "text-on-surface-secondary hover:bg-surface-inset hover:text-on-surface"
                )}
              >
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                  role.variant
                )}>
                  {role.label}
                </span>
                {role.value === currentRole && (
                  <Check className="ml-auto h-3.5 w-3.5 text-zinc-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
