"use client";

import { useCallback, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RiskBadge } from "@/components/records/risk-badge";
import {
  createVendor,
  updateVendor,
  toggleVendorActive,
  listVendors,
  type VendorListItem,
} from "@/lib/actions/vendor-actions";
import type { RiskLevel } from "@/generated/prisma";

interface VendorFormState {
  name: string;
  type: string;
  website: string;
  riskTier: RiskLevel;
  dataHandlingNotes: string;
  toolAliases: string; // comma-separated in the UI
}

const EMPTY_FORM: VendorFormState = {
  name: "",
  type: "LLM_PROVIDER",
  website: "",
  riskTier: "MODERATE",
  dataHandlingNotes: "",
  toolAliases: "",
};

function toForm(v: VendorListItem): VendorFormState {
  return {
    name: v.name,
    type: v.type,
    website: v.website ?? "",
    riskTier: v.riskTier,
    dataHandlingNotes: v.dataHandlingNotes ?? "",
    toolAliases: v.toolAliases.join(", "),
  };
}

export function VendorsManager({ initialVendors }: { initialVendors: VendorListItem[] }) {
  const [vendors, setVendors] = useState<VendorListItem[]>(initialVendors);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorListItem | null>(null);
  const [form, setForm] = useState<VendorFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await listVendors();
    if (result.success) {
      setVendors(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(v: VendorListItem) {
    setEditing(v);
    setForm(toForm(v));
    setError(null);
    setDialogOpen(true);
  }

  function set<K extends keyof VendorFormState>(key: K, value: VendorFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      ...form,
      toolAliases: form.toolAliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };
    const result = editing
      ? await updateVendor(editing.id, payload)
      : await createVendor(payload);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleToggle(v: VendorListItem) {
    if (!window.confirm(`${v.isActive ? "Deactivate" : "Activate"} the vendor "${v.name}"?`)) return;
    setTogglingId(v.id);
    const result = await toggleVendorActive(v.id, !v.isActive);
    setTogglingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">AI Vendors</h1>
          <p className="mt-1 text-sm text-on-surface-secondary">
            The AI providers your team relies on. A HIGH-tier vendor raises slip risk —
            it can never lower it. Tier changes apply to new classifications immediately
            and are recorded in the audit log.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add vendor
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vendor register</CardTitle>
          <CardDescription>
            {vendors.length} vendor{vendors.length === 1 ? "" : "s"} · matched against
            slip tools by alias (case-insensitive)
          </CardDescription>
        </CardHeader>

        {vendors.length === 0 ? (
          <p className="text-sm text-on-surface-tertiary">
            No vendors yet. Add the AI providers your team uses.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-default text-xs uppercase tracking-wide text-on-surface-tertiary">
                  <th className="pb-2 pr-4 font-medium">Vendor</th>
                  <th className="pb-2 pr-4 font-medium">Tier</th>
                  <th className="pb-2 pr-4 font-medium">Tool aliases</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} className="border-b border-border-default last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-on-surface">{v.name}</p>
                      <p className="text-xs text-on-surface-tertiary">
                        {v.type}
                        {v.website && (
                          <>
                            {" · "}
                            <a
                              href={v.website}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-on-surface-secondary"
                            >
                              {v.website.replace(/^https?:\/\//, "")}
                            </a>
                          </>
                        )}
                      </p>
                      {v.dataHandlingNotes && (
                        <p className="mt-1 max-w-md text-xs text-on-surface-secondary">
                          {v.dataHandlingNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <RiskBadge level={v.riskTier} />
                    </td>
                    <td className="py-3 pr-4">
                      <p className="max-w-xs text-xs text-on-surface-secondary">
                        {v.toolAliases.length > 0 ? v.toolAliases.join(", ") : "—"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          v.isActive
                            ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                            : "inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600"
                        }
                      >
                        {v.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(v)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant={v.isActive ? "danger" : "secondary"}
                          size="sm"
                          disabled={togglingId === v.id}
                          onClick={() => handleToggle(v)}
                        >
                          {togglingId === v.id ? "…" : v.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? `Edit ${editing.name}` : "Add vendor"}</DialogTitle>
        <DialogDescription>
          Aliases match the tool names recorded on slips (e.g. CHATGPT, Claude) —
          matching is case-insensitive.
        </DialogDescription>
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <Input
            id="vendor-name"
            label="Name"
            placeholder="OpenAI"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={saving}
            maxLength={100}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="vendor-type"
              label="Type"
              placeholder="LLM_PROVIDER"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              disabled={saving}
              maxLength={50}
              required
            />
            <Select
              id="vendor-tier"
              label="Risk tier"
              value={form.riskTier}
              onChange={(e) => set("riskTier", e.target.value as RiskLevel)}
              disabled={saving}
              options={[
                { value: "LOW", label: "LOW" },
                { value: "MODERATE", label: "MODERATE" },
                { value: "HIGH", label: "HIGH" },
              ]}
            />
          </div>
          <Input
            id="vendor-website"
            label="Website"
            placeholder="https://openai.com"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            disabled={saving}
            maxLength={255}
          />
          <div>
            <Input
              id="vendor-aliases"
              label="Tool aliases (comma-separated)"
              placeholder="CHATGPT, ChatGPT, GPT-4o"
              value={form.toolAliases}
              onChange={(e) => set("toolAliases", e.target.value)}
              disabled={saving}
            />
            <p className="mt-1 text-xs text-on-surface-tertiary">
              Tool names from slips and the extension that identify this vendor.
            </p>
          </div>
          <Textarea
            id="vendor-notes"
            label="Data-handling notes"
            placeholder="How this vendor handles customer inputs…"
            value={form.dataHandlingNotes}
            onChange={(e) => set("dataHandlingNotes", e.target.value)}
            disabled={saving}
            maxLength={2000}
          />
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add vendor"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
