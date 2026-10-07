"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePlatformOrganization } from "@/lib/actions/platform-actions";
import { DeleteOrgButton } from "@/components/platform/delete-org-button";

export function OrgSettings({ orgId, name, isDemo }: { orgId: string; name: string; isDemo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return <section className="rounded-xl border border-border-default bg-surface-elevated p-4 space-y-3">
    <h2 className="font-semibold">Organization settings</h2>
    <form key={`${name}-${isDemo}`} className="flex flex-wrap items-center gap-4" onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const result = await updatePlatformOrganization(orgId, String(form.get("name")), form.get("isDemo") === "on");
          setMessage(result.success ? "Organization updated." : result.error);
          if (result.success) router.refresh();
        } catch { setMessage("Access denied or update failed."); }
      });
    }}>
      <label>Name <input name="name" defaultValue={name} required minLength={2} maxLength={100} disabled={pending} className="rounded-md border border-border-default bg-surface px-3 py-2" /></label>
      <label><input type="checkbox" name="isDemo" defaultChecked={isDemo} disabled={pending} /> Demo organization</label>
      <button disabled={pending} className="rounded-md border border-border-default px-3 py-2">Save</button>
    </form>
    <p role="status" className="text-sm">{message}</p>
    <div className="text-sm text-on-surface-secondary">Deletion is blocked while members, records, audit history, or API keys exist. <DeleteOrgButton organizationId={orgId} organizationName={name} /></div>
  </section>;
}
