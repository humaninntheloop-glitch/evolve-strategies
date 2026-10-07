# Machine API integration tests

Run `npm ci && npm test`. `pretest` generates Prisma types (no migration or DB
connection); `npm run test:watch` runs watch mode. Vitest 3 supports the project's
existing Node 20 type dependency.

The suite executes the real route, Next middleware, record DAL, and revoke
server action with an entirely mocked Prisma module, session service, auth DAL,
and Next cache. No database credentials are needed; the real Prisma adapter is
never imported. There is no production or test-database access.

The stateful Prisma double stages transaction writes and commits only after the
callback succeeds. Non-transactional writes persist immediately, so removing
the route's transaction causes the orphan-record assertion to fail. This tests
the application transaction boundary, not PostgreSQL's transaction engine.

Every test resets modules (including rate-limit buckets), mock implementations,
records/audits/keys and fake time. Tests are shuffled and run serially. Reproduce
an order with `npx vitest run --sequence.seed=12345`.

Coverage: DRAFT creation/audit metadata/hash lookup; missing, malformed, unknown,
revoked and invalid-creator keys; cookie-free middleware passthrough plus a
neighboring-path control; forged tenant fields and tenant-scoped DAL reads;
422 issues and malformed JSON; audit failure rollback; 100/minute threshold,
Retry-After and window reset; real revoke action and cross-tenant revocation.

The POST API exposes no record-read operation. Read isolation is checked through
`getRecordById(id, key.organizationId)` and its actual Prisma query. These are
in-process integration tests, not full HTTP/Supabase/PostgreSQL end-to-end tests.
