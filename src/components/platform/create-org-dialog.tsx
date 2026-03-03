"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createOrganization } from "@/lib/actions/platform-actions";
import { Buildings, Check, Copy, CheckCircle, EnvelopeSimple } from "@phosphor-icons/react";

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [setupLink, setSetupLink] = useState("");
  const [copied, setCopied] = useState(false);

  function handleClose() {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setIsDemo(false);
    setSetupLink("");
    setCopied(false);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("isDemo", isDemo.toString());
    const result = await createOrganization(formData);
    if (!result.success) {
      setError(result.error);
    } else {
      setSetupLink(result.data ?? "");
      setSuccess(true);
    }
    setLoading(false);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(setupLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Buildings className="h-4 w-4" />
        Create Organization
      </Button>
      <Dialog open={open} onClose={handleClose}>
        {success ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-400/10">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3"><DialogTitle>Organization created</DialogTitle></div>
            <DialogDescription>
              The organization has been created with default risk categories and an admin account.
            </DialogDescription>

            {setupLink ? (
              <div className="mt-4 space-y-2">
                <p className="text-[13px] font-medium text-on-surface">
                  Share this setup link with the admin to set their password:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-border-default bg-surface-inset px-3 py-2 text-xs text-on-surface-secondary">
                    {setupLink}
                  </code>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 text-sm text-blue-700 dark:text-blue-400">
                <EnvelopeSimple className="h-4 w-4 shrink-0" />
                An invite email has been sent to the admin.
              </div>
            )}

            <div className="mt-5 flex justify-end border-t border-border-subtle pt-4">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform with an admin account.
            </DialogDescription>
            <form action={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {error}
                </div>
              )}
              <Input
                id="name"
                name="name"
                label="Organization Name"
                required
                placeholder="Acme Corp"
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemo}
                  onChange={(e) => setIsDemo(e.target.checked)}
                  className="h-4 w-4 rounded border-input-border text-zinc-700 focus:ring-zinc-400/20"
                />
                <div>
                  <span className="text-sm font-medium text-on-surface">Demo organization</span>
                  <p className="text-xs text-on-surface-tertiary">Users can switch roles freely</p>
                </div>
              </label>

              {/* Organization Admin */}
              <div className="border-t border-border-subtle pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
                  Organization Admin
                </p>
                <div className="space-y-3">
                  <Input
                    id="adminFullName"
                    name="adminFullName"
                    label="Full Name"
                    required
                    placeholder="Jane Smith"
                  />
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    label="Email"
                    required
                    placeholder="jane@acme.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
                <Button type="button" variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Dialog>
    </>
  );
}
