"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { createDemoAccount } from "@/lib/actions/platform-actions";
import { UserPlus, Check, Copy } from "@phosphor-icons/react";

interface Org {
  id: string;
  name: string;
}

interface CreateDemoAccountDialogProps {
  organizations: Org[];
}

export function CreateDemoAccountDialog({ organizations }: CreateDemoAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const orgOptions = organizations.map((org) => ({ value: org.id, label: org.name }));

  function handleClose() {
    setOpen(false);
    setCredentials(null);
    setError(null);
    setCopied(false);
  }

  async function handleSubmit(formData: FormData) {
    const orgId = formData.get("organizationId") as string;
    if (!orgId) return;

    setLoading(true);
    setError(null);
    const result = await createDemoAccount(orgId);
    if (!result.success) {
      setError(result.error);
    } else {
      setCredentials(result.data);
    }
    setLoading(false);
  }

  async function handleCopy() {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={organizations.length === 0}>
        <UserPlus className="h-4 w-4" />
        Create Demo Account
      </Button>
      <Dialog open={open} onClose={handleClose}>
        {credentials ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-3"><DialogTitle>Demo account created</DialogTitle></div>
            <DialogDescription>
              Share these credentials to access the demo.
            </DialogDescription>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-border-default bg-surface-inset p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-quaternary">Email</span>
                  <code className="text-sm font-medium text-on-surface">{credentials.email}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-quaternary">Password</span>
                  <code className="text-sm font-medium text-on-surface">{credentials.password}</code>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
                <Button variant="secondary" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Create Demo Account</DialogTitle>
            <DialogDescription>
              Select a demo organization to create an account in.
            </DialogDescription>
            <form action={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Select
                id="organizationId"
                name="organizationId"
                label="Demo Organization"
                options={orgOptions}
                placeholder="Select an organization..."
                required
              />
              <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
                <Button type="button" variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Dialog>
    </>
  );
}
