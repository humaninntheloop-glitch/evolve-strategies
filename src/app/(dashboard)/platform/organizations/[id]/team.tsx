"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgUserRole, toggleOrgUserActive, inviteUserToOrg, moveUserToOrg } from "@/lib/actions/platform-actions";
import type { ActionResult, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";

const roles: UserRole[] = ["EMPLOYEE", "REVIEWER", "ADMIN"];
type Member = { id: string; fullName: string; email: string; role: UserRole; isActive: boolean; createdAt: Date };
const field = "rounded-md border border-border-default bg-surface px-3 py-2 text-sm";

export function OrgTeam({ orgId, currentUserId, users, organizations }: {
  orgId: string; currentUserId: string; users: Member[]; organizations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [setupLink, setSetupLink] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  function run(action: () => Promise<ActionResult<unknown>>) {
    setMessage(""); setSetupLink("");
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) { setMessage(result.error); return; }
        if (typeof result.data === "string" && result.data) {
          setSetupLink(result.data); setMessage("Account created, but email was not sent. Share the setup link privately.");
        } else setMessage("Saved successfully.");
        router.refresh();
      } catch { setMessage("Access denied or operation failed. Please refresh and try again."); }
    });
  }
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Team</h2>
        <button className={field} onClick={() => setShowInvite(!showInvite)}>Invite user to this org</button>
      </div>
      <p className="text-sm text-on-surface-secondary">Moving a member changes their organization for future records only. Existing records stay in the original organization. Their old organization&apos;s API keys will no longer authenticate.</p>
      {message && <p role="status" className="text-sm">{message}</p>}
      {setupLink && <a href={setupLink} className="block break-all text-sm underline">Password setup link (share privately)</a>}
      {showInvite && <form className="flex flex-wrap gap-3 rounded-xl border border-border-default p-4" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        run(() => inviteUserToOrg(orgId, String(data.get("email")), String(data.get("fullName")), String(data.get("role")) as UserRole));
      }}>
        <label className="text-sm">Email<input className={`${field} block`} type="email" name="email" required disabled={pending} /></label>
        <label className="text-sm">Full name<input className={`${field} block`} name="fullName" minLength={2} maxLength={100} required disabled={pending} /></label>
        <label className="text-sm">Role<select className={`${field} block`} name="role" disabled={pending}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
        <button type="submit" className={field} disabled={pending}>Send invitation</button>
      </form>}
      <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-elevated">
        <table className="w-full text-left text-sm"><thead className="bg-surface-inset"><tr>
          {["Full name", "Email", "Role", "Active status", "Joined", "Move to org"].map(label => <th key={label} className="p-3">{label}</th>)}
        </tr></thead><tbody>{users.map(user => <tr key={user.id} className="border-t border-border-subtle">
          <td className="p-3">{user.fullName}{user.id === currentUserId && " (you)"}</td><td className="p-3">{user.email}</td>
          <td className="p-3"><select aria-label={`Role for ${user.fullName}`} className={field} value={user.role} disabled={pending || user.id === currentUserId}
            onChange={event => { const role = event.target.value as UserRole; run(() => updateOrgUserRole(orgId, user.id, role)); }}>{roles.map(role => <option key={role}>{role}</option>)}</select></td>
          <td className="p-3"><span>{user.isActive ? "Active" : "Inactive"}</span><button className={`${field} ml-2`} disabled={pending || user.id === currentUserId}
            onClick={() => run(() => toggleOrgUserActive(orgId, user.id, !user.isActive))}>{user.isActive ? "Deactivate" : "Activate"}</button></td>
          <td className="p-3 whitespace-nowrap">{formatDate(user.createdAt)}</td>
          <td className="p-3"><select aria-label={`Move ${user.fullName} to organization`} value="" className={field} disabled={pending || user.id === currentUserId}
            onChange={event => { const targetId = event.target.value; if (targetId && window.confirm("Move this member? Existing records will stay in the original organization.")) run(() => moveUserToOrg(user.id, targetId)); }}>
            <option value="">Choose organization</option>{organizations.filter(org => org.id !== orgId).map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select></td>
        </tr>)}</tbody></table>
        {users.length === 0 && <p className="p-4 text-sm">No members yet.</p>}
      </div>
    </section>
  );
}
