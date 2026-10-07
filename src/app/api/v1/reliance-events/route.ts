import { createAuditLog } from "@/lib/dal/audit-logs";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateTransition } from "@/lib/lifecycle/state-machine";
import { classifyRisk } from "@/lib/risk-classification";
import { getHighestVendorTier } from "@/lib/vendors";
import { generateAiSummary } from "@/lib/ai/summarize";
import { notifyReviewWorkflow } from "@/lib/email/review-notifications";
import type { AiOutputImpact, UserRole, RecordStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/reliance-events
 *
 * Machine API for integrations (e.g. the Chrome extension) to file AI
 * reliance events as DRAFT permission-slip records.
 *
 * Auth: `Authorization: Bearer hitl_<64 hex chars>`. The presented key is
 * SHA-256 hashed and matched against the stored hash — the plaintext key
 * is never persisted.
 */

const AI_OUTPUT_IMPACTS = [
  "INTERNAL_NOTES",
  "INTERNAL_RESEARCH",
  "INTERNAL_DOCUMENT",
  "CLIENT_COMMUNICATION",
  "EXTERNAL_REPORTS",
  "FINANCIAL_LEGAL",
  "REGULATORY_COMPLIANCE",
] as const;

const relianceEventSchema = z
  .object({
    submit: z.boolean().optional(),
    // Core reliance fields (same vocabulary as the web record form)
    aiToolUsed: z.array(z.string()).min(1, "Select at least one AI tool"),
    aiToolUsedOther: z.string().max(200).optional(),
    aiOutputImpact: z.enum(AI_OUTPUT_IMPACTS, {
      message: "aiOutputImpact is required",
    }),
    dataSensitivity: z.boolean(),
    aiUsageType: z.array(z.string()).min(1, "Select at least one AI reliance type"),
    aiUsageTypeOther: z.string().max(500).optional(),
    humanReviewPlan: z.array(z.string()).min(1, "Select at least one human review plan"),
    humanReviewPlanOther: z.string().max(500).optional(),
    aiUseJustification: z.array(z.string()).min(1, "Select at least one justification for AI use"),
    aiUseJustificationOther: z.string().max(500).optional(),
    // Extension-captured context (optional)
    intendedUseDescription: z.string().max(2000).optional(),
    aiSummary: z.string().max(20000).optional(),
    sourceUrl: z.string().url().max(2000).optional(),
    capturedAt: z.iso.datetime().optional(),
  })
  .refine(
    (data) =>
      !data.aiUsageType.includes("OTHER") ||
      (data.aiUsageTypeOther && data.aiUsageTypeOther.trim().length > 0),
    { message: "Please specify the other AI reliance type", path: ["aiUsageTypeOther"] }
  )
  .refine(
    (data) =>
      !data.humanReviewPlan.includes("OTHER") ||
      (data.humanReviewPlanOther && data.humanReviewPlanOther.trim().length > 0),
    { message: "Please specify the other review plan", path: ["humanReviewPlanOther"] }
  )
  .refine(
    (data) =>
      !data.aiUseJustification.includes("OTHER") ||
      (data.aiUseJustificationOther && data.aiUseJustificationOther.trim().length > 0),
    { message: "Please specify the other justification", path: ["aiUseJustificationOther"] }
  )
  .refine(
    (data) =>
      !data.aiToolUsed.includes("OTHER") ||
      (data.aiToolUsedOther && data.aiToolUsedOther.trim().length > 0),
    { message: "Please specify the other AI tool", path: ["aiToolUsedOther"] }
  );

/** Legacy derivations, kept in sync with src/lib/actions/record-actions.ts.
 *  (Copied here deliberately — that file is a "use server" module and cannot
 *  be imported from a route handler.) */
function deriveDistributionContext(impact: AiOutputImpact) {
  const external: AiOutputImpact[] = [
    "CLIENT_COMMUNICATION",
    "EXTERNAL_REPORTS",
    "FINANCIAL_LEGAL",
    "REGULATORY_COMPLIANCE",
  ];
  return external.includes(impact) ? "EXTERNAL" : "INTERNAL";
}

function deriveHighStakesDecision(impact: AiOutputImpact) {
  const highStakes: AiOutputImpact[] = ["FINANCIAL_LEGAL", "REGULATORY_COMPLIANCE"];
  return highStakes.includes(impact);
}

// ── Simple in-memory rate limiting (per principal) ──────────────────────────
// TODO: replace with a Redis/Upstash-backed limiter before multi-instance
// production use — this bucket is local to a single serverless instance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(bucketKey: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(bucketKey);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(bucketKey, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const token = /^Bearer (\S+)$/i.exec(header)?.[1] ?? null;
  if (token?.startsWith("hitl_")) {
    return /^Bearer (hitl_[a-f0-9]{64})$/i.exec(header)?.[1] ?? null;
  }
  return token;
}

export async function POST(request: Request) {
  // ── Authenticate the API key ────────────────────────────────────────────
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let apiKey: { id: string; organizationId: string; createdById: string } | null = null;
  let principal: { id: string; organizationId: string; role: UserRole };
  if (token.startsWith("hitl_")) {
    const keyHash = createHash("sha256").update(token).digest("hex");

    const resolvedKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { createdBy: { select: { isActive: true, role: true, organizationId: true } } },
    });
    if (!resolvedKey || !resolvedKey.isActive || !resolvedKey.createdBy.isActive ||
        resolvedKey.createdBy.role !== "ADMIN" || resolvedKey.createdBy.organizationId !== resolvedKey.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    apiKey = resolvedKey;
    principal = { id: resolvedKey.createdById, organizationId: resolvedKey.organizationId, role: resolvedKey.createdBy.role };
  } else {
    try {
      const supabase = await createClient();
      // Explicit token verification, never trust decoded claims or cookies.
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, organizationId: true, role: true, isActive: true },
      });
      if (!dbUser?.isActive) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      principal = dbUser;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Only authenticated principals allocate buckets; discard expired entries.
  for (const [key, bucket] of rateLimitBuckets) {
    if (Date.now() - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) rateLimitBuckets.delete(key);
  }
  if (isRateLimited(principal.id)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, {
      status: 429, headers: { "Retry-After": "60" },
    });
  }

  // ── Validate the payload ────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = relianceEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 }
    );
  }

  // ── Create the DRAFT record + audit entry ───────────────────────────────
  const data = parsed.data;
  const impact = data.aiOutputImpact as AiOutputImpact;

  try {
    const record = await prisma.$transaction(async (tx) => {
      let terminalStatus: RecordStatus = "DRAFT";
      const record = await tx.record.create({
        data: {
          organizationId: principal.organizationId,
          creatorId: principal.id,
          intendedUseDescription: data.intendedUseDescription ?? null,
          aiToolUsed: data.aiToolUsed,
          aiToolUsedOther: data.aiToolUsed.includes("OTHER")
            ? (data.aiToolUsedOther ?? null)
            : null,
          aiOutputImpact: impact,
          dataSensitivity: data.dataSensitivity,
          aiUsageType: data.aiUsageType,
          aiUsageTypeOther: data.aiUsageTypeOther ?? null,
          humanReviewPlan: data.humanReviewPlan,
          humanReviewPlanOther: data.humanReviewPlanOther ?? null,
          aiUseJustification: data.aiUseJustification,
          aiUseJustificationOther: data.aiUseJustificationOther ?? null,
          aiSummary: data.aiSummary ?? null,
          // Legacy derivations, kept for backward compat
          distributionContext: deriveDistributionContext(impact),
          highStakesDecision: deriveHighStakesDecision(impact),
          status: "DRAFT",
        },
        select: { id: true },
      });

      await createAuditLog({
        organizationId: principal.organizationId,
        recordId: record.id,
        actionType: "RECORD_CREATED_VIA_EXTENSION",
        actorId: principal.id,
        newState: "DRAFT",
        metadata: {
          sourceUrl: data.sourceUrl ?? null,
          capturedAt: data.capturedAt ?? null,
        },
      }, tx);
      if (data.submit) {
        const transition = validateTransition({
          currentStatus: "DRAFT", targetStatus: "SUBMITTED",
          actorRole: principal.role, actorId: principal.id, creatorId: principal.id,
        });
        if (!transition.allowed) throw new Error("Reliance event submission rejected");

        // Vendor tier can only raise risk, never lower it.
        const vendorInfo = impact ? await getHighestVendorTier(data.aiToolUsed) : null;
        const riskResult = impact
          ? classifyRisk({
              aiOutputImpact: impact,
              dataSensitivity: data.dataSensitivity,
              vendorTier: vendorInfo?.tier ?? null,
              vendorNames: vendorInfo?.names,
            })
          : { riskLevel: "MODERATE" as const, justification: "Risk could not be determined — missing AI output impact. Manual review required." };
        const aiSummary = await generateAiSummary({
          aiToolUsed: data.aiToolUsed, aiOutputImpact: impact ?? "UNKNOWN",
          aiUsageType: data.aiUsageType, humanReviewPlan: data.humanReviewPlan,
          aiUseJustification: data.aiUseJustification, dataSensitivity: data.dataSensitivity,
          riskLevel: riskResult.riskLevel, riskJustification: riskResult.justification,
        });
        // Newly created DRAFT only; a failed precondition aborts all writes.
        const submitted = await tx.record.updateMany({
          where: { id: record.id, organizationId: principal.organizationId, status: "DRAFT" },
          data: {
            status: "SUBMITTED", reviewerId: null, claimedAt: null, submittedAt: new Date(),
            riskLevel: riskResult.riskLevel, riskJustification: riskResult.justification, aiSummary,
          },
        });
        if (submitted.count !== 1) throw new Error("Reliance event submission rejected");
        await createAuditLog({
          organizationId: principal.organizationId, recordId: record.id, actorId: principal.id,
          actionType: "STATUS_CHANGE", previousState: "DRAFT", newState: "SUBMITTED",
          metadata: { riskLevel: riskResult.riskLevel, riskJustification: riskResult.justification },
        }, tx);
        terminalStatus = "SUBMITTED";
        if (riskResult.riskLevel === "LOW") {
          await tx.record.update({ where: { id: record.id }, data: { status: "APPROVED", approvedAt: new Date() } });
          await createAuditLog({
            organizationId: principal.organizationId, recordId: record.id, actorId: principal.id,
            actionType: "STATUS_CHANGE", previousState: "SUBMITTED", newState: "APPROVED",
            metadata: { autoApproved: true, reason: "Low risk - auto-authorized" },
          }, tx);
          await tx.record.update({ where: { id: record.id }, data: { status: "RECORDED", recordedAt: new Date() } });
          await createAuditLog({
            organizationId: principal.organizationId, recordId: record.id, actorId: principal.id,
            actionType: "STATUS_CHANGE", previousState: "APPROVED", newState: "RECORDED",
            metadata: { autoRecorded: true, reason: "Low risk - auto-recorded" },
          }, tx);
          terminalStatus = "RECORDED";
        }
      }
      if (apiKey) await tx.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
      return { ...record, status: terminalStatus };
    }, data.submit ? { timeout: 60_000 } : undefined);

    // Match UI notifications only after commit: no email for rolled-back records.
    if (data.submit) {
      try {
        await notifyReviewWorkflow(record.id, principal.organizationId, "SUBMITTED");
        if (record.status === "RECORDED") {
          await notifyReviewWorkflow(record.id, principal.organizationId, "APPROVED", "Low risk - auto-authorized");
        }
      } catch {
        console.error("reliance-events notification failed");
      }
    }
    return NextResponse.json(
      {
        id: record.id,
        status: record.status,
        url: `/permission-slips/${record.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (data.submit) {
      return NextResponse.json({ error: "Validation failed", issues: [{ path: "submit", message: error instanceof Error && error.message === "Reliance event submission rejected" ? "Cannot submit reliance event" : "Reliance event submission failed" }] }, { status: 422 });
    }
    // Intentionally no request-body logging: payloads may contain PII.
    console.error("reliance-events POST failed:", error instanceof Error ? `${error.name}: ${error.message} | code: ${(error as { code?: string }).code ?? "n/a"}` : String(error));
    return NextResponse.json(
      { error: "Failed to create reliance event" },
      { status: 500 }
    );
  }
}
