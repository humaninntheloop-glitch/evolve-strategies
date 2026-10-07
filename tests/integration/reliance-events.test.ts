import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type Row = { id: string; organizationId: string; [field: string]: unknown };
const mocks = vi.hoisted(() => ({
  prisma: {
    apiKey: { findUnique: vi.fn(), updateMany: vi.fn() },
    record: { create: vi.fn(), findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  session: vi.fn(),
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
}));
// Replace the entire Prisma module BEFORE importing application modules. No
// adapter, connection string, dotenv file, or real database client is loaded.
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/supabase/middleware", () => ({ updateSession: mocks.session }));
vi.mock("@/lib/dal/auth", () => ({ requireRole: mocks.requireRole }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

const token = `hitl_${"a".repeat(64)}`;
const keyHash = createHash("sha256").update(token).digest("hex");
const payload = {
  aiToolUsed: ["CHATGPT"], aiOutputImpact: "INTERNAL_RESEARCH",
  dataSensitivity: false, aiUsageType: ["DRAFTING"],
  humanReviewPlan: ["FACT_CHECK"], aiUseJustification: ["EFFICIENCY"],
  sourceUrl: "https://example.test/source", capturedAt: "2026-10-07T01:00:00.000Z",
};
const endpoint = "https://platform.test/api/v1/reliance-events";
function request(body: unknown = payload, authorization: string | null = `Bearer ${token}`) {
  return new Request(endpoint, {
    method: "POST", headers: {
      "Content-Type": "application/json", ...(authorization ? { authorization } : {}),
    }, body: JSON.stringify(body),
  });
}

let POST: typeof import("@/app/api/v1/reliance-events/route").POST;
let key: {
  id: string; organizationId: string; createdById: string; isActive: boolean;
  createdBy: { isActive: boolean; role: string; organizationId: string };
};
let records: Row[];
let audits: Array<Record<string, unknown>>;
let auditFails: boolean;
let usageWrites: number;

beforeEach(async () => {
  // Reload the route for a fresh rate-limit Map, reset mocks and deterministic
  // time for EVERY test. No concurrent tests share mutable state.
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-07T02:00:00Z"));
  key = { id: "key-a", organizationId: "org-a", createdById: "admin-a", isActive: true,
    createdBy: { isActive: true, role: "ADMIN", organizationId: "org-a" } };
  records = []; audits = []; auditFails = false; usageWrites = 0;
  mocks.prisma.apiKey.findUnique.mockImplementation(async ({ where }) => where.keyHash === keyHash ? key : null);
  mocks.requireRole.mockResolvedValue({ id: "admin-a", organizationId: "org-a", role: "ADMIN" });
  mocks.prisma.apiKey.updateMany.mockImplementation(async ({ where, data }) => {
    const matches = where.id === key.id && where.organizationId === key.organizationId && key.isActive;
    if (matches) key.isActive = data.isActive;
    return { count: matches ? 1 : 0 };
  });
  mocks.prisma.record.findFirst.mockImplementation(async ({ where }) =>
    records.find(row => row.id === where.id && row.organizationId === where.organizationId) ?? null);
  // Non-transactional writes deliberately persist immediately. A regression
  // removing $transaction leaves an orphan and fails the atomicity assertion.
  mocks.prisma.record.create.mockImplementation(async ({ data }) => {
    const row = { id: `record-${records.length + 1}`, ...data };
    records.push(row); return row;
  });
  mocks.prisma.auditLog.create.mockImplementation(async ({ data }) => {
    if (auditFails) throw new Error("Injected audit failure");
    audits.push(data); return data;
  });
  mocks.prisma.$transaction.mockImplementation(async (callback) => {
    const stagedRecords: Row[] = [];
    const stagedAudits: Array<Record<string, unknown>> = [];
    let stagedUsage = 0;
    const tx = {
      record: { create: vi.fn(async ({ data }: { data: Omit<Row, "id"> }) => {
        const row = { id: `record-${records.length + stagedRecords.length + 1}`, ...data } as Row;
        stagedRecords.push(row); return row;
      }) },
      auditLog: { create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (auditFails) throw new Error("Injected audit failure");
        stagedAudits.push(data); return data;
      }) },
      apiKey: { update: vi.fn(async () => { stagedUsage++; return key; }) },
    };
    const result = await callback(tx);
    records.push(...stagedRecords); audits.push(...stagedAudits); usageWrites += stagedUsage;
    return result;
  });
  mocks.session.mockImplementation(() => { throw new Error("Machine API must not use Supabase session auth"); });
  POST = (await import("@/app/api/v1/reliance-events/route")).POST;
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe.shuffle("POST /api/v1/reliance-events (mocked Prisma integration)", () => {
  it("creates an org-scoped DRAFT and audit entry using the hashed key", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "record-1", status: "DRAFT", url: "/permission-slips/record-1" });
    expect(mocks.prisma.apiKey.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { keyHash } }));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ organizationId: "org-a", creatorId: "admin-a", status: "DRAFT", dataSensitivity: false });
    expect(audits).toEqual([expect.objectContaining({ organizationId: "org-a", recordId: "record-1",
      actorId: "admin-a", newState: "DRAFT", actionType: "RECORD_CREATED_VIA_EXTENSION",
      metadata: { sourceUrl: payload.sourceUrl, capturedAt: payload.capturedAt } })]);
    expect(usageWrites).toBe(1);
  });

  it.each([null, "", "Basic abc", "Bearer hitl_short", `Bearer ${token} extra`, `Bearer hitl_${"z".repeat(64)}`])(
    "rejects missing/malformed authorization %s", async authorization => {
      expect((await POST(request(payload, authorization))).status).toBe(401);
      expect(records).toEqual([]); expect(audits).toEqual([]);
      expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    });
  it("rejects an unknown correctly formatted key", async () => {
    expect((await POST(request(payload, `Bearer hitl_${"b".repeat(64)}`))).status).toBe(401);
    expect(records).toEqual([]);
  });
  it.each(["revoked", "inactive creator", "demoted creator", "moved creator"])("rejects %s", async reason => {
    if (reason === "revoked") key.isActive = false;
    if (reason === "inactive creator") key.createdBy.isActive = false;
    if (reason === "demoted creator") key.createdBy.role = "EMPLOYEE";
    if (reason === "moved creator") key.createdBy.organizationId = "org-b";
    expect((await POST(request())).status).toBe(401);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("bypasses Supabase with no session cookie and reaches the real handler", async () => {
    const { middleware } = await import("@/middleware");
    const incoming = new NextRequest(request());
    expect(incoming.cookies.getAll()).toEqual([]);
    const gate = await middleware(incoming);
    expect(gate.status).not.toBe(307);
    expect(gate.headers.get("location")).toBeNull();
    expect(gate.headers.get("x-middleware-next")).toBe("1");
    expect(mocks.session).not.toHaveBeenCalled();
    expect((await POST(incoming)).status).toBe(201);
  });
  it("does not bypass session middleware for a neighboring browser path", async () => {
    const { middleware } = await import("@/middleware");
    const { NextResponse } = await import("next/server");
    mocks.session.mockResolvedValue(NextResponse.redirect("https://platform.test/login"));
    const response = await middleware(new NextRequest("https://platform.test/api/v1/reliance-events/other"));
    expect(response.status).toBe(307);
    expect(mocks.session).toHaveBeenCalledOnce();
  });

  it("ignores forged tenant/creator fields and scopes record reads to the caller's org", async () => {
    records.push({ id: "record-b", organizationId: "org-b", creatorId: "admin-b", status: "DRAFT" });
    expect((await POST(request({ ...payload, organizationId: "org-b", creatorId: "admin-b", status: "APPROVED" }))).status).toBe(201);
    expect(records[1]).toMatchObject({ organizationId: "org-a", creatorId: "admin-a", status: "DRAFT" });
    const { getRecordById } = await import("@/lib/dal/records");
    expect(await getRecordById("record-b", key.organizationId)).toBeNull();
    expect(mocks.prisma.record.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: "record-b", organizationId: "org-a" } }));
    expect(await getRecordById("record-2", key.organizationId)).toMatchObject({ organizationId: "org-a" });
  });

  it.each([
    [{}, "aiToolUsed"], [{ ...payload, aiOutputImpact: "INVALID" }, "aiOutputImpact"],
    [{ ...payload, dataSensitivity: "false" }, "dataSensitivity"],
    [{ ...payload, aiUsageType: [] }, "aiUsageType"],
    [{ ...payload, humanReviewPlan: [] }, "humanReviewPlan"],
    [{ ...payload, aiUseJustification: [] }, "aiUseJustification"],
    [{ ...payload, aiToolUsed: ["OTHER"] }, "aiToolUsedOther"],
    [{ ...payload, sourceUrl: "not-a-url" }, "sourceUrl"],
    [{ ...payload, capturedAt: "yesterday" }, "capturedAt"],
  ])("returns structured 422 issues for invalid payload %#", async (body, path) => {
    const response = await POST(request(body));
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: "Validation failed", issues: expect.arrayContaining([
      expect.objectContaining({ path, message: expect.any(String) }),
    ]) });
    expect(records).toEqual([]); expect(audits).toEqual([]);
  });
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(new Request(endpoint, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: "{" }));
    expect(response.status).toBe(400); expect(records).toEqual([]);
  });

  it("rolls back the Record and usage timestamp if the audit write fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    auditFails = true;
    expect((await POST(request())).status).toBe(500);
    expect(mocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(records).toEqual([]); expect(audits).toEqual([]); expect(usageWrites).toBe(0);
    expect(log).toHaveBeenCalledWith("reliance-events POST failed");
    auditFails = false;
    expect((await POST(request())).status).toBe(201);
    expect(records).toHaveLength(1);
  });

  it("allows 100 requests, limits request 101, and resets after one minute", async () => {
    for (let i = 0; i < 100; i++) expect((await POST(request())).status).toBe(201);
    const limited = await POST(request());
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("60");
    expect(records).toHaveLength(100);
    vi.advanceTimersByTime(60_000);
    expect((await POST(request())).status).toBe(201);
  });

  it("revokes through the real ADMIN action and rejects subsequent use", async () => {
    expect((await POST(request())).status).toBe(201);
    const { revokeApiKey } = await import("@/lib/actions/api-key-actions");
    expect(await revokeApiKey(key.id)).toEqual({ success: true, data: undefined });
    expect(mocks.requireRole).toHaveBeenCalledWith("ADMIN");
    expect(mocks.prisma.apiKey.updateMany).toHaveBeenCalledWith({ where: { id: key.id, organizationId: "org-a", isActive: true }, data: { isActive: false } });
    expect((await POST(request())).status).toBe(401);
    expect(records).toHaveLength(1);
  });
  it("cannot revoke an org B key as an org A admin", async () => {
    key.organizationId = "org-b"; key.createdBy.organizationId = "org-b";
    const { revokeApiKey } = await import("@/lib/actions/api-key-actions");
    expect(await revokeApiKey(key.id)).toEqual({ success: false, error: "API key not found" });
    expect(key.isActive).toBe(true);
  });
});
