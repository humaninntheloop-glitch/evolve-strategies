"use client";
import { useState, useTransition } from "react";
import { verifyAuditChain, exportAuditCSV, backfillAuditChain } from "@/lib/actions/audit-actions";

export function ChainControls({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(task: () => Promise<void>) {
    startTransition(async () => { try { await task(); } catch { setMessage("Operation failed. Check permissions, migration/backfill state, and server logs."); } });
  }
  return <div className="mb-6 space-y-2">
    <div className="flex gap-3">
      <button disabled={pending} className="rounded-md border px-3 py-2" onClick={() => run(async () => {
        const result = await verifyAuditChain(); setMessage(result.ok ? `OK — ${result.checked} entries verified` : `Broken chain at row ${result.brokenRowId}`);
      })}>Verify chain</button>
      <button disabled={pending} className="rounded-md border px-3 py-2" onClick={() => run(async () => {
        const csv = await exportAuditCSV(); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a"); link.href = url; link.download = "audit-log.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage("CSV exported — all organization entries across pages.");
      })}>Export CSV</button>
      {isSuperAdmin && <button disabled={pending} className="rounded-md border px-3 py-2" onClick={() => {
        if (confirm("One-off backfill of ALL organizations. Back up the database first. Existing chains will not be rewritten. Continue?")) run(async () => { const count = await backfillAuditChain(); setMessage(`Backfilled ${count} rows`); });
      }}>Backfill existing chain (once)</button>}
    </div>
    <p role="status" className="text-sm">{message}</p>
    <p className="text-xs text-on-surface-tertiary">Per-organization chain. Detects changes to hashed fields, not a full-database rewrite or deletion of the final entry without an externally retained head hash.</p>
  </div>;
}
