"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DeleteOrgButton } from "@/components/platform/delete-org-button";
import { formatDate } from "@/lib/utils";
import { Flask, Users, FileText } from "@phosphor-icons/react/ssr";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
  createdAt: Date;
  _count: { users: number; records: number };
}

interface OrganizationTableProps {
  organizations: OrgRow[];
}

export function OrganizationTable({ organizations }: OrganizationTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-surface-elevated p-8 text-center">
        <p className="text-sm text-on-surface-tertiary">No organizations yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default bg-surface-inset">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Name</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Slug</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Type</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Users</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Records</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">Created</th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {organizations.map((org) => (
            <tr key={org.id} className="transition-colors duration-150 hover:bg-surface-inset">
              <td className="px-4 py-3.5 text-sm font-medium text-on-surface"><Link href={`/platform/organizations/${org.id}`} className="underline underline-offset-4">{org.name}</Link></td>
              <td className="px-4 py-3.5 text-sm font-mono text-on-surface-secondary">{org.slug}</td>
              <td className="px-4 py-3.5">
                {org.isDemo ? (
                  <Badge variant="amber">
                    <Flask className="h-3 w-3" />
                    Demo
                  </Badge>
                ) : (
                  <Badge variant="gray">Production</Badge>
                )}
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-secondary">
                  <Users className="h-3.5 w-3.5 text-on-surface-quaternary" />
                  {org._count.users}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-secondary">
                  <FileText className="h-3.5 w-3.5 text-on-surface-quaternary" />
                  {org._count.records}
                </span>
              </td>
              <td className="px-4 py-3.5 text-sm text-on-surface-tertiary">{formatDate(org.createdAt)}</td>
              <td className="px-4 py-3.5 text-right">
                <DeleteOrgButton organizationId={org.id} organizationName={org.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
