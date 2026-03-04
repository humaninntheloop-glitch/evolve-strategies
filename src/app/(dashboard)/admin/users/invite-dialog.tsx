"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { inviteUser } from "@/lib/actions/admin-actions";
import { UserPlus, Check, Copy, LinkSimple, EnvelopeOpen } from "@phosphor-icons/react";
import { ROLE_LABELS } from "@/types";

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [copied, setCopied] = useState(false);

  function handleClose() {
    setOpen(false);
    setSetupLink(null);
    setEmailSent(false);
    setInvitedEmail("");
    setError(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const result = await inviteUser(formData);
    if (!result.success) {
      setError(result.error);
    } else if (result.data) {
      // Fallback: got a setup link to share manually
      setSetupLink(result.data);
    } else {
      // Email was sent successfully
      setInvitedEmail(email);
      setEmailSent(true);
    }
    setLoading(false);
  }

  async function handleCopy() {
    if (!setupLink) return;
    await navigator.clipboard.writeText(setupLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Invite User
      </Button>
      <Dialog open={open} onClose={handleClose}>
        {emailSent ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-400/10">
              <EnvelopeOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3"><DialogTitle>Invite sent</DialogTitle></div>
            <DialogDescription>
              An invitation email has been sent to <span className="font-medium text-on-surface">{invitedEmail}</span>. They&apos;ll receive a link to set their password and sign in.
            </DialogDescription>
            <div className="mt-5 flex justify-end border-t border-border-subtle pt-4">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </>
        ) : setupLink ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-400/10">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3"><DialogTitle>User created</DialogTitle></div>
            <DialogDescription>
              The invite email could not be sent. Share this setup link with the user instead.
            </DialogDescription>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-inset p-3">
                <LinkSimple className="h-4 w-4 shrink-0 text-on-surface-quaternary" />
                <code className="flex-1 truncate text-xs text-on-surface-secondary">{setupLink}</code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-md p-1.5 text-on-surface-tertiary transition-colors hover:bg-surface-elevated hover:text-on-surface"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-on-surface-quaternary">
                This link expires in 24 hours. The user will set their own password when they open it.
              </p>
              <div className="flex justify-end border-t border-border-subtle pt-4">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Add a new user to your organization.
            </DialogDescription>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {error}
                </div>
              )}
              <Input id="fullName" name="fullName" label="Full Name" required placeholder="Jane Smith" />
              <Input id="email" name="email" type="email" label="Email" required placeholder="jane@company.com" />
              <Select
                id="role"
                name="role"
                label="Role"
                options={roleOptions}
                placeholder="Select a role..."
                required
              />
              <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
                <Button type="button" variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Dialog>
    </>
  );
}
