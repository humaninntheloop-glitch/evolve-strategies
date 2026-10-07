# Compliance starter set

18 paraphrased requirements: NIST AI RMF 1.0 (12), EU AI Act Article 50 (3),
ISO/IEC 42001:2023 Annex A data controls (3). This is a curated starter set,
not the full catalogs, normative text, certification, or legal advice. Verify
references/applicability with the authoritative publications linked in catalog.ts.
Especially Article 50(4) applies to particular content/use contexts with
exceptions, not every client communication. Rule matches prompt review only.

## Deployment (manual, no build-time migrations)

1. Back up the intended Supabase database.
2. Hand-apply all of prisma/migrations/20261007172500_compliance_mappings/migration.sql
   in Supabase SQL Editor. It creates three tables AND seeds all 18 requirements.
3. From the repository using a direct connection to that same database, reconcile:
   `npx prisma migrate resolve --applied 20261007172500_compliance_mappings`
4. Run `npx prisma generate`, then deploy the code. Do not add migrate deploy to
   the Vercel build. No DB command was executed by the agent.

seedComplianceStarterSet() in seed.ts is an idempotent programmatic reseed helper
for explicitly controlled environments (invoke via tsx with the project alias).
The initial SQL already loads the seed; no package scripts need to change.
Existing application tables and UUID conventions are reused; no new extension.

## Behavior

Every web UI submission gets GOVERN 2.1 and MAP 1.1. External client/report use
adds Article 50(4)/(5) applicability prompts. Sensitive use adds MAP 2.3,
MEASURE 2.10 and ISO A.7.3/4/5. Financial/legal/regulatory use adds MAP 1.5,
MAP 5.1, MEASURE 2.5 and MANAGE 1.3 (consequential-use tier, not legal EU high-risk
classification). Insert-only auto-mapping preserves reviewer-confirmed rows.
Submission/status audits/mappings commit together before low-risk auto-recording;
incomplete seed causes rollback rather than silently missing mappings.

Reviewer/admin manual edits verify tenant ownership and write mapping + audit
atomically. Confirm switches autoMapped to false and records reviewer/time.
Mappings can be maintained after recording without changing immutable Record
fields; append-only audit entries preserve who added/removed mappings.
Manual removal may be suggested again on a future submission; no suppression
model was requested. No historical records are backfilled.

Scope: web UI submit hook only. The machine API's submit:true path is unchanged
and does not auto-map (route.ts was explicitly prohibited).
