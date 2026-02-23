"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createOrganization } from "@/lib/actions/platform-actions";
import { Buildings, Check } from "@phosphor-icons/react";

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  function handleClose() {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setIsDemo(false);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("isDemo", isDemo.toString());
    const result = await createOrganization(formData);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
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
              The organization has been created with default risk categories.
            </DialogDescription>
            <div className="mt-5 flex justify-end border-t border-border-subtle pt-4">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform.
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
