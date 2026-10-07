"use client";

import { useCallback, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKeyListItem,
} from "@/lib/actions/api-key-actions";

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyListItem[] }) {
  const [keys, setKeys] = useState<ApiKeyListItem[]>(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await listApiKeys();
    if (result.success) {
      setKeys(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNewKey(null);
    setCreating(true);

    const result = await createApiKey(name);
    setCreating(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setNewKey(result.data.key);
    setName("");
    await refresh();
  }

  async function handleRevoke(id: string, keyName: string) {
    if (!window.confirm(`Revoke the API key "${keyName}"? Integrations using it will stop working.`)) {
      return;
    }
    setRevokingId(id);
    const result = await revokeApiKey(id);
    setRevokingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function handleCopy() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard — select the key manually.");
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">API Keys</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Machine credentials for integrations such as the Chrome extension.
          Keys can file reliance events via{" "}
          <code className="rounded bg-surface-inset px-1.5 py-0.5 font-mono text-xs">
            POST /api/v1/reliance-events
          </code>
          .
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create a new API key</CardTitle>
          <CardDescription>
            Give the key a descriptive name (e.g. &ldquo;Chrome extension &mdash; pilot&rdquo;).
            The plaintext key is shown once and never stored.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              id="api-key-name"
              placeholder="Key name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? "Creating…" : "Create key"}
          </Button>
        </form>

        {newKey && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Copy this key now — it will not be shown again.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded bg-white px-3 py-2 font-mono text-xs text-zinc-900">
                {newKey}
              </code>
              <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing keys</CardTitle>
          <CardDescription>{keys.length} key{keys.length === 1 ? "" : "s"} in your organization</CardDescription>
        </CardHeader>

        {keys.length === 0 ? (
          <p className="text-sm text-on-surface-tertiary">
            No API keys yet. Create one above to connect an integration.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-default text-xs uppercase tracking-wide text-on-surface-tertiary">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Key prefix</th>
                  <th className="pb-2 pr-4 font-medium">Created by</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 pr-4 font-medium">Last used</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-border-default last:border-0">
                    <td className="py-3 pr-4 font-medium text-on-surface">{key.name}</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-surface-inset px-1.5 py-0.5 font-mono text-xs">
                        {key.keyPrefix}…
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-on-surface-secondary">{key.createdByName}</td>
                    <td className="py-3 pr-4 text-on-surface-secondary">{formatDate(key.createdAt)}</td>
                    <td className="py-3 pr-4 text-on-surface-secondary">{formatDate(key.lastUsedAt)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          key.isActive
                            ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                            : "inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600"
                        }
                      >
                        {key.isActive ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {key.isActive && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={revokingId === key.id}
                          onClick={() => handleRevoke(key.id, key.name)}
                        >
                          {revokingId === key.id ? "Revoking…" : "Revoke"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
