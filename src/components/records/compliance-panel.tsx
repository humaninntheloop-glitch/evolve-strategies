"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRecordRequirement } from "@/lib/actions/compliance-actions";

type Requirement = { id: string; refCode: string; title: string; description: string; framework: { name: string; version: string } };
type Mapping = { requirementId: string; autoMapped: boolean; mappedAt: Date; mappedBy: { fullName: string }; requirement: Requirement };
export function CompliancePanel({ recordId, requirements, mappings, canEdit }: { recordId: string; requirements: Requirement[]; mappings: Mapping[]; canEdit: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  function change(id: string, included: boolean) {
    startTransition(async () => {
      try {
        const result = await setRecordRequirement(recordId, id, included);
        setError(result.success ? "" : result.error);
        if (result.success) router.refresh();
      } catch { setError("Access denied or mapping failed."); }
    });
  }
  return <section className="mt-6 rounded-xl border border-border-default bg-surface-elevated p-6 space-y-4">
    <h2 className="text-xl font-semibold">Compliance framework mappings</h2>
    <p className="text-sm text-on-surface-secondary">Curated starter set — not a full catalog, certification, or determination of legal compliance. Auto-mappings suggest requirements to assess; reviewers must verify applicability and evidence. Consequential-use rules do not establish EU AI Act high-risk classification.</p>
    {error && <p role="alert">{error}</p>}
    <div className="flex flex-wrap gap-2">{mappings.map(mapping => <a key={mapping.requirementId} href={`#requirement-${mapping.requirementId}`} className="rounded-full border border-border-default px-3 py-1 text-sm underline">{mapping.requirement.framework.name} · {mapping.requirement.refCode}</a>)}</div>
    {!mappings.length && <p className="text-sm">No requirements mapped yet.</p>}
    {requirements.map(requirement => {
      const mapping = mappings.find(item => item.requirementId === requirement.id);
      return <details key={requirement.id} id={`requirement-${requirement.id}`} className="rounded-lg border border-border-subtle p-3" open={!!mapping}>
        <summary className="cursor-pointer text-sm font-medium">{requirement.framework.name} · {requirement.refCode} — {requirement.title}</summary>
        <p className="mt-2 text-sm text-on-surface-secondary">{requirement.description}</p>
        <p className="text-xs text-on-surface-tertiary">Version: {requirement.framework.version}</p>
        {mapping && <p className="mt-2 text-xs">{mapping.autoMapped ? "Suggested automatically" : "Reviewer-confirmed"} · {mapping.mappedBy.fullName} · {new Date(mapping.mappedAt).toISOString()}</p>}
        {canEdit && <div className="mt-2 flex gap-2">
          {(!mapping || mapping.autoMapped) && <button disabled={pending} className="rounded-md border px-3 py-1 text-sm" onClick={() => change(requirement.id, true)}>{mapping ? "Confirm mapping" : "Add mapping"}</button>}
          {mapping && <button disabled={pending} className="rounded-md border px-3 py-1 text-sm" onClick={() => change(requirement.id, false)}>Remove mapping</button>}
        </div>}
      </details>;
    })}
    <p className="text-xs text-on-surface-tertiary">Starter descriptions are paraphrased. Verify against <a className="underline" href="https://airc.nist.gov/airmf-resources/airmf/">NIST</a>, <a className="underline" href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj">EU AI Act</a>, and the <a className="underline" href="https://www.iso.org/standard/81230.html">licensed ISO/IEC 42001 standard</a>.</p>
  </section>;
}
